import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { createAgentSessionToken } from "./_core/agentSession";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, agentProcedure, publicProcedure, router } from "./_core/trpc";
import {
  authenticateAgent,
  createAgentProperty,
  createLeadSubmission,
  createStaffAccount,
  createTestimonial,
  deleteAgentProperty,
  deletePropertyById,
  deleteStaffAccount,
  deleteTestimonial,
  ensureCmsSeedData,
  ensureDefaultAgentAccounts,
  getAgentPropertyById,
  getHomepagePayload,
  getPropertyById,
  getSiteSettings,
  listAgentProperties,
  listAllProperties,
  listAllTestimonials,
  listLeadSubmissions,
  listPublishedProperties,
  passwordFromAgentEmail,
  listStaffAccounts,
  updateAgentProperty,
  updatePropertyById,
  updateSiteSettings,
  updateStaffAccount,
  updateTestimonial,
  hashAgentPassword,
} from "./db";
import { storagePut } from "./storage";

const imageInputSchema = z.object({
  name: z.string().min(1),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  dataBase64: z.string().min(1),
});

const storedOrUploadedImageSchema = z.union([imageInputSchema, z.string().url(), z.null()]).optional();

const propertyInputSchema = z.object({
  agentId: z.number().int().positive().optional(),
  title: z.string().min(2),
  address: z.string().min(2),
  street: z.string().trim().optional().nullable(),
  neighborhood: z.string().min(2),
  city: z.string().min(2).default("ירושלים"),
  price: z.number().int().positive(),
  rooms: z.number().int().positive(),
  sqm: z.number().int().positive(),
  builtSqm: z.number().int().positive().optional().nullable(),
  outdoorSpace: z.string().trim().optional().nullable(),
  floor: z.number().int().optional().nullable(),
  status: z.enum(["חדש", "בלעדי", "למכירה", "נמכר"]),
  description: z.string().min(10),
  descriptionHtml: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
  images: z.array(imageInputSchema).max(12).default([]),
});

const staffInputSchema = z.object({
  accountRole: z.enum(["agent", "admin"]).default("agent"),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  password: z.string().min(6).optional(),
  roleTitle: z.string().min(2),
  bio: z.string().optional().nullable(),
  photoUrl: storedOrUploadedImageSchema,
  sortOrder: z.number().int().default(0),
  isFeaturedOnHomepage: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

const testimonialInputSchema = z.object({
  quote: z.string().min(4),
  sourceName: z.string().min(2),
  sourceLabel: z.string().min(2).default("WhatsApp"),
  stars: z.number().int().min(1).max(5).default(5),
  whatsappImageUrl: storedOrUploadedImageSchema,
  displayOrder: z.number().int().min(1).default(1),
  isPublished: z.boolean().default(true),
});

const siteSettingsInputSchema = z.object({
  siteName: z.string().min(2).optional(),
  headerLogoUrl: storedOrUploadedImageSchema,
  footerLogoUrl: storedOrUploadedImageSchema,
  landsmanLogoUrl: storedOrUploadedImageSchema,
  heroBackgroundUrl: storedOrUploadedImageSchema,
  shayAboutImageUrl: storedOrUploadedImageSchema,
  heroHeadline: z.string().min(2).optional(),
  heroTypingText: z.string().min(2).optional(),
  whatsappLink: z.string().url().optional(),
  officePhone: z.string().min(6).optional(),
  aboutTitle: z.string().min(2).optional(),
  aboutSubtitle: z.string().min(2).optional(),
  landsmanTitle: z.string().min(2).optional(),
  landsmanBody: z.string().min(2).optional(),
  footerSlogan: z.string().min(2).optional(),
});

const leadInputSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(6),
  neighborhood: z.string().min(2),
  rooms: z.number().int().positive(),
  sqm: z.number().int().positive(),
  notes: z.string().optional().nullable(),
});

function decodeBase64File(dataBase64: string) {
  const normalized = dataBase64.includes(",") ? dataBase64.split(",").pop() ?? "" : dataBase64;
  return Buffer.from(normalized, "base64");
}

function slugifyFilename(value: string) {
  const [baseName, extension = ""] = value.replace(/\s+/g, "-").split(/\.(?=[^.]+$)/);
  const safeBase = baseName.replace(/[^a-zA-Z0-9\-_א-ת]/g, "").slice(0, 80) || `image-${Date.now()}`;
  const safeExtension = extension.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return safeExtension ? `${safeBase}.${safeExtension}` : safeBase;
}

async function resolveStoredImage(
  storagePath: string,
  image: z.infer<typeof storedOrUploadedImageSchema>,
  fallbackName: string,
) {
  if (!image) return null;
  if (typeof image === "string") return image;

  const binary = decodeBase64File(image.dataBase64);
  const upload = await storagePut(
    `${storagePath}/${Date.now()}-${slugifyFilename(image.name || fallbackName)}`,
    binary,
    image.mimeType,
  );

  return upload.url;
}

async function uploadImagesForProperty(ownerId: number, images: Array<z.infer<typeof imageInputSchema>>) {
  return Promise.all(
    images.map(async (image, index) => {
      const binary = decodeBase64File(image.dataBase64);
      const upload = await storagePut(
        `team-shay/properties/${ownerId}/${Date.now()}-${index}-${image.name}`,
        binary,
        image.mimeType,
      );

      return {
        imageUrl: upload.url,
        imageKey: upload.key,
        sortOrder: index,
        altText: image.name,
      };
    }),
  );
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  publicSite: router({
    home: publicProcedure.query(async () => {
      await ensureCmsSeedData();
      return getHomepagePayload();
    }),
    properties: publicProcedure
      .input(
        z
          .object({
            area: z.string().trim().optional(),
            minPrice: z.number().int().positive().optional(),
            maxPrice: z.number().int().positive().optional(),
          })
          .optional(),
      )
      .query(async ({ input }) => listPublishedProperties(input)),
    submitLead: publicProcedure.input(leadInputSchema).mutation(async ({ input }) => {
      const leadId = await createLeadSubmission({
        fullName: input.fullName,
        phone: input.phone,
        neighborhood: input.neighborhood,
        rooms: input.rooms,
        sqm: input.sqm,
        notes: input.notes ?? null,
      });

      return {
        success: true,
        leadId,
      } as const;
    }),
  }),
  agent: router({
    me: publicProcedure.query(async ({ ctx }) => {
      await ensureDefaultAgentAccounts();
      return ctx.agentSession;
    }),
    propertyById: agentProcedure
      .input(z.object({ propertyId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        return getAgentPropertyById(ctx.agentSession.id, input.propertyId);
      }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const agent = await authenticateAgent(input.email, input.password);
        if (!agent) {
          throw new Error("פרטי ההתחברות אינם תקינים");
        }

        const cookieOptions = getSessionCookieOptions(ctx.req);
        const sessionToken = await createAgentSessionToken(agent.id);

        ctx.res.cookie("team_shay_agent_session", String(agent.id), {
          ...cookieOptions,
          maxAge: 1000 * 60 * 60 * 24 * 14,
        });

        return {
          success: true,
          sessionToken,
          agent: {
            id: agent.id,
            name: agent.name,
            email: agent.email,
            phone: agent.phone,
            accountRole: agent.accountRole,
            roleTitle: agent.roleTitle,
            photoUrl: agent.photoUrl,
          },
        };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("team_shay_agent_session", { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    listProperties: agentProcedure.query(async ({ ctx }) => {
      return listAgentProperties(ctx.agentSession.id);
    }),
    createProperty: agentProcedure
      .input(propertyInputSchema)
      .mutation(async ({ ctx, input }) => {
        const uploadedImages = await uploadImagesForProperty(ctx.agentSession.id, input.images);

        const propertyId = await createAgentProperty(
          {
            agentId: ctx.agentSession.id,
            title: input.title,
            address: input.address,
            street: input.street ?? null,
            neighborhood: input.neighborhood,
            city: input.city,
            price: input.price,
            rooms: input.rooms,
            sqm: input.sqm,
            builtSqm: input.builtSqm ?? null,
            outdoorSpace: input.outdoorSpace ?? null,
            floor: input.floor ?? null,
            status: input.status,
            description: input.description,
            descriptionHtml: input.descriptionHtml ?? null,
            featuredImageUrl: uploadedImages[0]?.imageUrl ?? null,
            isPublished: input.isPublished,
          },
          uploadedImages,
        );

        return {
          success: true,
          propertyId,
        };
      }),
    updateProperty: agentProcedure
      .input(z.object({ propertyId: z.number().int().positive(), data: propertyInputSchema }))
      .mutation(async ({ ctx, input }) => {
        const uploadedImages = await uploadImagesForProperty(ctx.agentSession.id, input.data.images);
        const existingProperty = await getAgentPropertyById(ctx.agentSession.id, input.propertyId);
        if (!existingProperty) {
          throw new Error("הנכס המבוקש לא נמצא.");
        }

        await updateAgentProperty(
          ctx.agentSession.id,
          input.propertyId,
          {
            title: input.data.title,
            address: input.data.address,
            street: input.data.street ?? null,
            neighborhood: input.data.neighborhood,
            city: input.data.city,
            price: input.data.price,
            rooms: input.data.rooms,
            sqm: input.data.sqm,
            builtSqm: input.data.builtSqm ?? null,
            outdoorSpace: input.data.outdoorSpace ?? null,
            floor: input.data.floor ?? null,
            status: input.data.status,
            description: input.data.description,
            descriptionHtml: input.data.descriptionHtml ?? null,
            featuredImageUrl: uploadedImages[0]?.imageUrl ?? existingProperty.featuredImageUrl,
            isPublished: input.data.isPublished,
          },
          uploadedImages,
        );

        return { success: true } as const;
      }),
    deleteProperty: agentProcedure
      .input(z.object({ propertyId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await deleteAgentProperty(ctx.agentSession.id, input.propertyId);
        return { success: true } as const;
      }),
  }),
  admin: router({
    me: publicProcedure.query(({ ctx }) => {
      return ctx.agentSession ?? null;
    }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const account = await authenticateAgent(input.email, input.password);
        if (!account) {
          throw new Error("פרטי ההתחברות אינם תקינים");
        }

        const cookieOptions = getSessionCookieOptions(ctx.req);
        const sessionToken = await createAgentSessionToken(account.id);

        ctx.res.cookie("team_shay_agent_session", String(account.id), {
          ...cookieOptions,
          maxAge: 1000 * 60 * 60 * 24 * 14,
        });

        return {
          success: true,
          sessionToken,
          admin: {
            id: account.id,
            name: account.name,
            email: account.email,
            phone: account.phone,
            accountRole: account.accountRole,
            roleTitle: account.roleTitle,
          },
        } as const;
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("team_shay_agent_session", { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    dashboard: agentProcedure.query(async () => {
      await ensureCmsSeedData();
      const [settings, testimonialsRows, staff, propertiesRows, leads] = await Promise.all([
        getSiteSettings(),
        listAllTestimonials(),
        listStaffAccounts(),
        listAllProperties(),
        listLeadSubmissions(),
      ]);

      return {
        settings,
        testimonials: testimonialsRows,
        staff,
        properties: propertiesRows,
        leads,
      };
    }),
    updateSiteSettings: agentProcedure.input(siteSettingsInputSchema).mutation(async ({ input }) => {
      const resolvedInput = {
        ...input,
        headerLogoUrl: await resolveStoredImage("team-shay/site-settings/header-logo", input.headerLogoUrl, "header-logo"),
        footerLogoUrl: await resolveStoredImage("team-shay/site-settings/footer-logo", input.footerLogoUrl, "footer-logo"),
        landsmanLogoUrl: await resolveStoredImage("team-shay/site-settings/landsman-logo", input.landsmanLogoUrl, "landsman-logo"),
        heroBackgroundUrl: await resolveStoredImage("team-shay/site-settings/hero-background", input.heroBackgroundUrl, "hero-background"),
        shayAboutImageUrl: await resolveStoredImage("team-shay/site-settings/shay-about", input.shayAboutImageUrl, "shay-about"),
      };
      await updateSiteSettings(resolvedInput);
      return { success: true } as const;
    }),
    listStaff: agentProcedure.query(async () => listStaffAccounts()),
    createStaff: agentProcedure.input(staffInputSchema).mutation(async ({ input }) => {
      const normalizedEmail = input.email.toLowerCase();
      const photoUrl = await resolveStoredImage(
        `team-shay/staff/${normalizedEmail}`,
        input.photoUrl,
        `${input.name}-profile`,
      );

      const accountId = await createStaffAccount({
        accountRole: input.accountRole,
        name: input.name,
        email: normalizedEmail,
        phone: input.phone,
        passwordHash: hashAgentPassword(input.password ?? passwordFromAgentEmail(normalizedEmail)),
        roleTitle: input.roleTitle,
        bio: input.bio ?? null,
        photoUrl,
        sortOrder: input.sortOrder,
        isFeaturedOnHomepage: input.isFeaturedOnHomepage,
        isActive: input.isActive,
        managedByAdmin: true,
      });

      return { success: true, accountId } as const;
    }),
    updateStaff: agentProcedure
      .input(z.object({ accountId: z.number().int().positive(), data: staffInputSchema.partial() }))
      .mutation(async ({ input }) => {
        const normalizedEmail = input.data.email?.toLowerCase();
        const nextData = {
          ...input.data,
          email: normalizedEmail,
          passwordHash: input.data.password
            ? hashAgentPassword(input.data.password)
            : normalizedEmail
              ? hashAgentPassword(passwordFromAgentEmail(normalizedEmail))
              : undefined,
          photoUrl: await resolveStoredImage(
            `team-shay/staff/${normalizedEmail ?? input.accountId}`,
            input.data.photoUrl,
            `staff-${input.accountId}`,
          ),
        };
        delete (nextData as { password?: string }).password;

        await updateStaffAccount(input.accountId, nextData);
        return { success: true } as const;
      }),
    deleteStaff: agentProcedure
      .input(z.object({ accountId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await deleteStaffAccount(input.accountId);
        return { success: true } as const;
      }),
    listTestimonials: agentProcedure.query(async () => listAllTestimonials()),
    createTestimonial: agentProcedure.input(testimonialInputSchema).mutation(async ({ input }) => {
      const testimonialId = await createTestimonial({
        ...input,
        whatsappImageUrl: await resolveStoredImage(
          `team-shay/testimonials/${input.sourceName}`,
          input.whatsappImageUrl,
          `${input.sourceName}-testimonial`,
        ),
      });
      return { success: true, testimonialId } as const;
    }),
    updateTestimonial: agentProcedure
      .input(z.object({ testimonialId: z.number().int().positive(), data: testimonialInputSchema.partial() }))
      .mutation(async ({ input }) => {
        await updateTestimonial(input.testimonialId, {
          ...input.data,
          whatsappImageUrl: await resolveStoredImage(
            `team-shay/testimonials/${input.data.sourceName ?? input.testimonialId}`,
            input.data.whatsappImageUrl,
            `testimonial-${input.testimonialId}`,
          ),
        });
        return { success: true } as const;
      }),
    deleteTestimonial: agentProcedure
      .input(z.object({ testimonialId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await deleteTestimonial(input.testimonialId);
        return { success: true } as const;
      }),
    listLeads: agentProcedure.query(async () => listLeadSubmissions()),
    listProperties: agentProcedure.query(async () => listAllProperties()),
    propertyById: agentProcedure
      .input(z.object({ propertyId: z.number().int().positive() }))
      .query(async ({ input }) => getPropertyById(input.propertyId)),
    createProperty: agentProcedure
      .input(propertyInputSchema.extend({ agentId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const uploadedImages = await uploadImagesForProperty(ctx.agentSession?.id ?? input.agentId, input.images);
        const propertyId = await createAgentProperty(
          {
            agentId: input.agentId,
            title: input.title,
            address: input.address,
            street: input.street ?? null,
            neighborhood: input.neighborhood,
            city: input.city,
            price: input.price,
            rooms: input.rooms,
            sqm: input.sqm,
            builtSqm: input.builtSqm ?? null,
            outdoorSpace: input.outdoorSpace ?? null,
            floor: input.floor ?? null,
            status: input.status,
            description: input.description,
            descriptionHtml: input.descriptionHtml ?? null,
            featuredImageUrl: uploadedImages[0]?.imageUrl ?? null,
            isPublished: input.isPublished,
          },
          uploadedImages,
        );

        return { success: true, propertyId } as const;
      }),
    updateProperty: agentProcedure
      .input(z.object({ propertyId: z.number().int().positive(), data: propertyInputSchema }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getPropertyById(input.propertyId);
        if (!existing) {
          throw new Error("הנכס המבוקש לא נמצא.");
        }

        const uploadedImages = await uploadImagesForProperty(
          ctx.agentSession?.id ?? existing.agentId,
          input.data.images,
        );

        await updatePropertyById(
          input.propertyId,
          {
            agentId: input.data.agentId ?? existing.agentId,
            title: input.data.title,
            address: input.data.address,
            street: input.data.street ?? null,
            neighborhood: input.data.neighborhood,
            city: input.data.city,
            price: input.data.price,
            rooms: input.data.rooms,
            sqm: input.data.sqm,
            builtSqm: input.data.builtSqm ?? null,
            outdoorSpace: input.data.outdoorSpace ?? null,
            floor: input.data.floor ?? null,
            status: input.data.status,
            description: input.data.description,
            descriptionHtml: input.data.descriptionHtml ?? null,
            featuredImageUrl: uploadedImages[0]?.imageUrl ?? existing.featuredImageUrl,
            isPublished: input.data.isPublished,
          },
          uploadedImages,
        );

        return { success: true } as const;
      }),
    deleteProperty: agentProcedure
      .input(z.object({ propertyId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await deletePropertyById(input.propertyId);
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;

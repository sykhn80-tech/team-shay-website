import CrmLayout from "@/components/CrmLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { CrmSearchSelect } from "@/components/CrmSearchSelect";

export default function CrmTemplates() {
  const utils = trpc.useUtils();
  const templatesQuery = trpc.crm2.templates.list.useQuery();

  const [name, setName] = useState("");
  const [type, setType] = useState<"shabbat" | "exclusivity" | "followup" | "general">("general");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const createMutation = trpc.crm2.templates.create.useMutation({
    onSuccess: async () => {
      await utils.crm2.templates.list.invalidate();
      setName("");
      setType("general");
      setContent("");
      setImageUrl("");
      toast.success("תבנית נוצרה.");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.crm2.templates.update.useMutation({
    onSuccess: async () => {
      await utils.crm2.templates.list.invalidate();
      toast.success("התבנית עודכנה.");
    },
    onError: (error) => toast.error(error.message),
  });
  const deleteMutation = trpc.crm2.templates.delete.useMutation({
    onSuccess: async () => { await utils.crm2.templates.list.invalidate(); toast.success("התבנית נמחקה."); },
  });

  return (
    <CrmLayout title="תבניות הודעות" subtitle="ניהול תבניות שבת שלום + בלעדיות שבועית + הודעות פולואפ.">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-black text-slate-950">+ תבנית חדשה</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="שם תבנית"
            className="h-11 rounded-xl border border-slate-200 px-3"
          />
          <CrmSearchSelect value={type} onChange={value => setType((value ?? "general") as "shabbat" | "exclusivity" | "followup" | "general")} isClearable={false}
            options={[{ value: "shabbat", label: "שבת שלום" }, { value: "exclusivity", label: "בלעדיות שבועית" }, { value: "followup", label: "פולואפ" }, { value: "general", label: "כללי" }]} />
        </div>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="תוכן התבנית (אפשר placeholders כמו {name} {address} {price} {url})"
          className="mt-3 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm"
        />
        <input
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="Image URL (אופציונלי)"
          className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3"
        />
        <Button
          onClick={() => {
            if (!name.trim() || !content.trim()) {
              toast.error("שם ותוכן הם שדות חובה.");
              return;
            }
            createMutation.mutate({
              name: name.trim(),
              type,
              content: content.trim(),
              imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
              isActive: true,
            });
          }}
          disabled={createMutation.isPending}
          className="mt-4 rounded-full bg-[#d9ae4c] text-black hover:bg-[#c99a31]"
        >
          צור תבנית
        </Button>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[340px_1fr]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-black">טיפים לתבניות דינמיות</h2>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">חשוב! כדי שהתגיות יעבדו, צריך למלא את הנתונים בעמוד „פעולות שיווק” עבור הליד הרלוונטי.</div>
        <h3 className="mt-5 font-black">תגיות ליד</h3>
        <div className="mt-2 flex flex-wrap gap-2">{["{שם הלקוח}", "{כתובת הנכס}", "{טלפון}"].map((tag) => <code key={tag} className="rounded-lg bg-slate-100 px-2 py-1 text-xs">{tag}</code>)}</div>
        <h3 className="mt-5 font-black">תגיות פעולות שיווק</h3>
        <div className="mt-2 flex flex-wrap gap-2">{["יד2", "מדלן", "פייסבוק", "אורגני דיגיטל", "ממומן דיגיטל", "שת״פ מתווכים", "וואטסאפ", "פליירים", "מכתבי שכנים", "צילום", "עיתון מקומי", "בית פתוח", "פניות טלפון", "שלטים"].map((tag) => <code key={tag} className="rounded-lg bg-[#fff4d8] px-2 py-1 text-xs">{`{${tag}}`}</code>)}</div>
      </aside>
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-black text-slate-950">תבניות פעילות</h2>
        <div className="mt-4 space-y-4">
          {(templatesQuery.data ?? []).map((template) => (
            <article key={template.id} className="rounded-xl border border-slate-200 bg-[#faf8f1] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-black text-slate-900">{template.name}</p>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-600">{template.type}</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">וואטסאפ</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${template.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                  {template.isActive ? "פעיל" : "לא פעיל"}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{template.content}</p>
              {template.imageUrl ? (
                <p className="mt-1 text-xs text-slate-500 break-all">תמונה: {template.imageUrl}</p>
              ) : null}
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateMutation.mutate({ id: template.id, data: { isActive: !template.isActive } })}
                >
                  {template.isActive ? "כבה" : "הפעל"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate({ id: template.id })} className="mr-2 text-red-600">מחיקה</Button>
              </div>
            </article>
          ))}
        </div>
      </section>
      </div>
    </CrmLayout>
  );
}

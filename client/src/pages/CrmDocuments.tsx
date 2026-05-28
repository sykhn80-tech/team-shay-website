import CrmLayout from "@/components/CrmLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { toast } from "sonner";

async function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("קריאת הקובץ נכשלה"));
    reader.readAsDataURL(file);
  });
}

export default function CrmDocuments() {
  const utils = trpc.useUtils();
  const documentsQuery = trpc.crm2.documents.list.useQuery();
  const [search, setSearch] = useState("");

  const uploadMutation = trpc.crm2.documents.upload.useMutation({
    onSuccess: async () => {
      await utils.crm2.documents.list.invalidate();
      toast.success("מסמך הועלה בהצלחה.");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = trpc.crm2.documents.delete.useMutation({
    onSuccess: async () => {
      await utils.crm2.documents.list.invalidate();
      toast.success("מסמך נמחק.");
    },
    onError: (error) => toast.error(error.message),
  });

  const filteredDocs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return documentsQuery.data ?? [];
    return (documentsQuery.data ?? []).filter((item) => item.name.toLowerCase().includes(query));
  }, [documentsQuery.data, search]);

  return (
    <CrmLayout title="מסמכים" subtitle="ניהול מסמכי לקוחות ונכסים עם אחסון ב-Vercel Blob.">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="חיפוש מסמך..."
            className="h-11 flex-1 rounded-xl border border-slate-200 px-3"
          />

          <label className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-[#d9ae4c] px-4 text-sm font-black text-black hover:bg-[#c99a31]">
            + העלה מסמך
            <input
              type="file"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  const dataBase64 = await fileToBase64(file);
                  uploadMutation.mutate({
                    name: file.name,
                    type: "other",
                    mimeType: file.type || "application/octet-stream",
                    dataBase64,
                    leadId: null,
                    propertyId: null,
                    notes: null,
                  });
                } catch (error) {
                  toast.error((error as Error).message);
                } finally {
                  event.currentTarget.value = "";
                }
              }}
            />
          </label>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-black text-slate-950">רשימת מסמכים</h2>
        <div className="mt-4 space-y-3">
          {filteredDocs.map((document) => (
            <div key={document.id} className="rounded-xl border border-slate-200 bg-[#faf8f1] p-3">
              <p className="text-sm font-black text-slate-900">{document.name}</p>
              <p className="mt-1 text-xs text-slate-500">{new Date(document.uploadedAt).toLocaleDateString("he-IL")} · {document.type}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={document.url} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline">הורד</Button>
                </a>
                <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate({ id: document.id })}>
                  מחק
                </Button>
              </div>
            </div>
          ))}
          {!filteredDocs.length ? <p className="text-sm text-slate-500">אין מסמכים להצגה.</p> : null}
        </div>
      </section>
    </CrmLayout>
  );
}

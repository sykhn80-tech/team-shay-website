import { useMemo, useState } from "react";
import { Download, FileText, Folder, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import CrmLayout from "@/components/CrmLayout";
import { Button } from "@/components/ui/button";
import { CrmSearchSelect } from "@/components/CrmSearchSelect";
import { leadLabel } from "@/lib/lead-display";
import { trpc } from "@/lib/trpc";

const defaultFolders = ["כל המסמכים", "הזמנת שירותי תיווך", "חשבוניות מס", "טפסי בלעדיות", "נסחי טאבו", "עוסק", "קבלות", "תוכניות אדריכליות"];

async function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CrmDocuments() {
  const utils = trpc.useUtils();
  const documentsQuery = trpc.crm2.documents.list.useQuery();
  const leadsQuery = trpc.crm.list.useQuery({ search: undefined, agentId: undefined });
  const [search, setSearch] = useState("");
  const [leadId, setLeadId] = useState<number | null>(null);
  const [folder, setFolder] = useState("כל המסמכים");
  const [sort, setSort] = useState("new");

  const uploadMutation = trpc.crm2.documents.upload.useMutation({ onSuccess: async () => { await utils.crm2.documents.list.invalidate(); toast.success("המסמך הועלה."); } });

  const docs = useMemo(() => (documentsQuery.data ?? [])
    .filter((document) => folder === "כל המסמכים" || document.folderName === folder)
    .filter((document) => !leadId || document.leadId === leadId)
    .filter((document) => `${document.name} ${document.folderName ?? ""}`.toLowerCase().includes(search.toLowerCase()))
    .sort((left, right) => (sort === "new" ? -1 : 1) * (new Date(left.uploadedAt).getTime() - new Date(right.uploadedAt).getTime())), [documentsQuery.data, folder, leadId, search, sort]);

  return (
    <CrmLayout title="מסמכים" subtitle="נהל את כל המסמכים של הלקוחות">
      <div className="mb-5 flex justify-end">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-black text-black"><Plus className="size-4" />העלה מסמך חדש
          <input type="file" className="hidden" onChange={async (event) => {
            const file = event.target.files?.[0]; if (!file) return;
            uploadMutation.mutate({ name: file.name, type: "other", mimeType: file.type || "application/octet-stream", dataBase64: await fileToBase64(file), leadId, propertyId: null, notes: null, folderName: folder, folderId: null });
          }} />
        </label>
      </div>
      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4">
          {defaultFolders.map((name) => <button key={name} type="button" onClick={() => setFolder(name)} className={`mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-3 text-right text-sm font-black ${folder === name ? "bg-[#D4AF37] text-black" : "text-slate-600 hover:bg-slate-50"}`}><Folder className="size-4" />{name}</button>)}
          <button type="button" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#D4AF37] px-3 py-3 text-sm font-black text-[#9a7319]"><Plus className="size-4" />תיקיה חדשה</button>
        </aside>
        <section>
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="חיפוש מסמך..." />
            <CrmSearchSelect value={leadId} onChange={(value) => setLeadId(value == null ? null : Number(value))} placeholder="כל הלידים" options={(leadsQuery.data ?? []).map((lead) => ({ value: lead.id, label: leadLabel(lead) }))} />
            <CrmSearchSelect value={sort} onChange={(value) => setSort(String(value ?? "new"))} isClearable={false} options={[{ value: "new", label: "מהחדש לישן" }, { value: "old", label: "מהישן לחדש" }]} />
          </div>
          <p className="my-3 text-sm font-bold text-slate-500">מציג {docs.length} מסמכים</p>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-right text-sm"><thead className="bg-slate-50"><tr>{["מסמך", "ליד", "תיקיה", "תאריך", "פעולות"].map((title) => <th key={title} className="px-4 py-3 font-black text-slate-500">{title}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{docs.map((document) => <tr key={document.id}><td className="px-4 py-4"><span className="flex items-center gap-2 font-black"><FileText className="size-4 text-[#9a7319]" />{document.name}</span></td><td className="px-4 py-4">{document.leadId ? leadLabel((leadsQuery.data ?? []).find((lead) => lead.id === document.leadId)) : "—"}</td><td className="px-4 py-4">{document.folderName ?? "כל המסמכים"}</td><td className="px-4 py-4">{new Date(document.uploadedAt).toLocaleDateString("he-IL")}</td><td className="px-4 py-4"><div className="flex gap-2"><Button size="icon" variant="outline"><Pencil className="size-4" /></Button><a href={document.url} target="_blank" rel="noreferrer"><Button size="icon" variant="outline"><Download className="size-4" /></Button></a></div></td></tr>)}</tbody></table>
          </div>
        </section>
      </div>
    </CrmLayout>
  );
}

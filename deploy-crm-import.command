#!/bin/bash
# לחץ פעמיים על הקובץ הזה — הוא ידאג לכל השאר

cd "$(dirname "$0")"

echo "🔧 מנקה lock file..."
rm -f .git/index.lock

echo "📦 commit..."
git -c user.email="sykhn80@gmail.com" -c user.name="Shay" \
  commit -m "feat: add crm-import page with Airtable leads (760 records)"

echo "🚀 push ל-GitHub — Vercel יפרוס אוטומטית..."
git push

echo ""
echo "✅ נגמר! חכה ~2 דקות ואז עבור באתר שלך ל: /crm-import"
echo ""
read -p "לחץ Enter לסגירה..."

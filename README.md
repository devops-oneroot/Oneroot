# OneRoot Sales CRM

A specialized B2B Agri-Commodity Sales & Export CRM designed for **OneRoot Farm** — managing international spice buyers, European turmeric importers, email outreach campaigns, supplier procurement, and lead pipelines.

---

## 🏗️ Architecture

The project consists of two core applications:

- **Frontend (`sales_crm-master/`)**: Modern Next.js 14+ App Router dashboard with Tailwind CSS, TanStack Query, and Lucide icons.
- **Backend (`sales_crm_backend-master/`)**: Node.js & Express REST API with MongoDB Atlas (Mongoose ODM), Nodemailer with SMTP delivery, and Cloudinary for document uploads.

---

## 🚀 Key Features

1. **Buyer & Importer Ingestion**:
   - Ingest international buyers via CSV/Excel spreadsheets with intelligent field auto-mapping.
   - Manual entry for high-touch trade leads.

2. **Verification & Lead Scoring**:
   - Automated website live checks and domain MX/DNS verification.
   - Quality grading (`Grade A`, `Grade B`, `Grade C`) based on contact validity and business verification.

3. **Direct Email Outreach**:
   - 1-Click personalized email composer addressing buyers by contact name, company, and products.
   - Bulk personalized outreach capabilities with customizable templates.
   - Automatic attachment of the official European Specification Deck (`OneRoot_IPM_Turmeric_Europe_Specifications.pdf`).
   - Live tracking of sent emails, delivery statuses, and bounce notifications.

4. **Sales Pipeline Kanban**:
   - Full deal lifecycle tracking: New → Verified → Contact Established → Quotation Sent → Negotiation → Sample Dispatched → Deal Won.

---

## 🛠️ Setup & Local Development

### 1. Backend

```bash
cd sales_crm_backend-master/sales_crm_backend-master
npm install
cp .env.example .env # Configure your MONGODB_URI and SMTP credentials
npm run dev
```

Server runs on `http://localhost:5000`.

### 2. Frontend

```bash
cd sales_crm-master/sales_crm-master
npm install
cp .env.example .env.local
npm run dev
```

Web application opens on `http://localhost:3000`.

---

## 🔒 Security Note

All database credentials, API keys, and environment variables are strictly excluded via `.gitignore`. Ensure your `.env` files are configured per environment.

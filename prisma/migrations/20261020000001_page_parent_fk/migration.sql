-- 20261020000001_page_parent_fk
-- FK constraint for page parent/child organization (schema already shipped
-- the column in 20261020000000_cms_admin_security).

ALTER TABLE "pages" ADD CONSTRAINT "pages_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

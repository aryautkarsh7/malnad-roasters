"use client";
import { useState } from "react";
import Field from "./Field";
import { validateProduct } from "@/lib/validate";

const BLANK = { name: "", category: "", description: "", price: "", stock: "", image_url: "" };

export default function ProductForm({ initial, categories = [], busy, serverError, onSubmit, onCancel }) {
  const [values, setValues] = useState(
    initial ? { ...BLANK, ...initial, price: String(initial.price), stock: String(initial.stock) } : BLANK
  );
  const [errors, setErrors] = useState({});
  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    const found = validateProduct(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    onSubmit({
      name: values.name.trim(),
      category: values.category.trim(),
      description: values.description.trim(),
      price: Number(values.price),
      stock: Number(values.stock),
      image_url: values.image_url.trim(),
    });
  }

  return (
    <form className="drawer" onSubmit={submit} noValidate>
      <h2 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>{initial ? "Edit product" : "Add product"}</h2>
      {serverError && <div className="alert alert-error" role="alert" style={{ marginBottom: "1rem" }}>{serverError}</div>}
      <div className="form-grid">
        <Field label="Name" name="name" value={values.name} onChange={set("name")} error={errors.name} />
        <div className="form-grid two">
          <div>
            <Field label="Category" name="category" list="category-options" value={values.category} onChange={set("category")} error={errors.category} />
            <datalist id="category-options">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <Field label="Image URL" name="image_url" value={values.image_url} onChange={set("image_url")} error={errors.image_url} hint="Leave empty to show a placeholder." />
        </div>
        <div className="form-grid two">
          <Field label="Price in rupees" name="price" inputMode="numeric" value={values.price} onChange={set("price")} error={errors.price} />
          <Field label="Units in stock" name="stock" inputMode="numeric" value={values.stock} onChange={set("stock")} error={errors.stock} hint="Set to 0 to mark the product as sold out." />
        </div>
        <Field label="Description" name="description" textarea value={values.description} onChange={set("description")} />
      </div>
      <div className="row" style={{ marginTop: "1.25rem" }}>
        <button className="btn" disabled={busy}>{busy ? "Saving" : initial ? "Save changes" : "Add product"}</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </form>
  );
}

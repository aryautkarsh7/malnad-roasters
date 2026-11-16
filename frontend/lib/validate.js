export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

export function validateShipping(v) {
  const e = {};
  if (v.full_name.trim().length < 2) e.full_name = "Enter your full name.";
  if (!/^[6-9]\d{9}$/.test(v.phone.trim())) e.phone = "Enter a 10 digit mobile number.";
  if (v.address.trim().length < 5) e.address = "Enter your street address.";
  if (v.city.trim().length < 2) e.city = "Enter your city.";
  if (!/^\d{6}$/.test(v.pincode.trim())) e.pincode = "Enter a 6 digit pincode.";
  return e;
}

export function validateProduct(v) {
  const e = {};
  if (!v.name.trim()) e.name = "Name is required.";
  if (!v.category.trim()) e.category = "Category is required.";
  const price = Number(v.price);
  if (!Number.isInteger(price) || price <= 0) e.price = "Price must be a whole number above 0.";
  const stock = Number(v.stock);
  if (v.stock === "" || !Number.isInteger(stock) || stock < 0) e.stock = "Stock must be 0 or more.";
  const url = v.image_url.trim();
  if (url && !/^(https?:\/\/|\/)/.test(url)) e.image_url = "Use a link starting with http://, https:// or /.";
  return e;
}

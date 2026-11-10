// Admin: products, product images, categories, subcategories, stock
const productService = require("../../services/product.service");
const categoryService = require("../../services/category.service");
const { publicPath } = require("../../middleware/upload");
const { badRequest } = require("../../utils/httpError");
const { imageByUrl } = require("../../validators/product");

// ---- Products -------------------------------------------------------------

const listProducts = async (req, res) => res.json(await productService.listAdmin(req.valid.query));
const getProduct = async (req, res) => res.json(await productService.getAdmin(req.valid.params.id));
const createProduct = async (req, res) => res.status(201).json(await productService.create(req.valid.body));
const updateProduct = async (req, res) => res.json(await productService.update(req.valid.params.id, req.valid.body));
const updateStock = async (req, res) => res.json(await productService.updateStock(req.valid.params.id, req.valid.body));

async function deleteProduct(req, res) {
  await productService.remove(req.valid.params.id);
  res.json({ message: "Product deleted" });
}

// ---- Product images --------------------------------------------------------

// POST /api/admin/products/:id/images  (multipart "images", up to 10)  or JSON { url, altText }
async function addImages(req, res) {
  const productId = req.valid.params.id;

  if (req.files?.length) {
    const images = req.files.map((file) => ({ url: publicPath("products", file) }));
    return res.status(201).json(await productService.addImages(productId, images));
  }

  if (req.body?.url) {
    const parsed = imageByUrl.safeParse(req.body);
    if (!parsed.success) throw badRequest("A valid image URL is required");
    return res.status(201).json(await productService.addImages(productId, [parsed.data]));
  }

  throw badRequest("Upload at least one image (field name: images) or send an image url");
}

const reorderImages = async (req, res) =>
  res.json(await productService.reorderImages(req.valid.params.id, req.valid.body.order));

const updateImage = async (req, res) =>
  res.json(await productService.updateImage(req.valid.params.id, req.valid.params.imageId, req.valid.body));

const deleteImage = async (req, res) =>
  res.json(await productService.deleteImage(req.valid.params.id, req.valid.params.imageId));

// ---- Categories ------------------------------------------------------------

const listCategories = async (req, res) => res.json(await categoryService.listAdmin());
const createCategory = async (req, res) => res.status(201).json(await categoryService.create(req.valid.body));
const updateCategory = async (req, res) => res.json(await categoryService.update(req.valid.params.id, req.valid.body));

async function deleteCategory(req, res) {
  await categoryService.remove(req.valid.params.id);
  res.json({ message: "Category deleted" });
}

const createSubcategory = async (req, res) =>
  res.status(201).json(await categoryService.createSubcategory(req.valid.params.id, req.valid.body));
const updateSubcategory = async (req, res) =>
  res.json(await categoryService.updateSubcategory(req.valid.params.id, req.valid.body));

async function deleteSubcategory(req, res) {
  await categoryService.removeSubcategory(req.valid.params.id);
  res.json({ message: "Subcategory deleted" });
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct,
  addImages,
  reorderImages,
  updateImage,
  deleteImage,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
};

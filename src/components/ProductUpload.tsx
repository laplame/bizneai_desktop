import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Image as ImageIcon,
  Search,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  createProduct, 
  uploadImages, 
  checkSimilarProducts,
  getProductCategories,
  getMainCategories,
  type CreateProductRequest,
  type SimilarityCheckRequest,
  type SimilarityCheckResponse,
  type ProductCategory,
  type MainCategory
} from '../api/index';

interface ProductUploadProps {
  onProductCreated?: (product: any) => void;
  onClose?: () => void;
  businessId: string;
}

const ProductUpload: React.FC<ProductUploadProps> = ({ 
  onProductCreated, 
  onClose, 
  businessId 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isCheckingSimilarity, setIsCheckingSimilarity] = useState(false);
  const [showSimilarityResults, setShowSimilarityResults] = useState(false);
  const [similarityResults, setSimilarityResults] = useState<SimilarityCheckResponse | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('');
  const [filteredCategories, setFilteredCategories] = useState<ProductCategory[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    category: '',
    mainCategory: '',
    sku: '',
    brand: '',
    status: 'active' as 'active' | 'inactive',
    specifications: {} as Record<string, any>,
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    tags: [] as string[],
    metadata: {} as Record<string, any>
  });

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Filter categories when main category changes
  useEffect(() => {
    if (selectedMainCategory) {
      const filtered = categories.filter(cat => cat.mainCategory === selectedMainCategory);
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [selectedMainCategory, categories]);

  const loadCategories = async () => {
    try {
      const [categoriesResponse, mainCategoriesResponse] = await Promise.all([
        getProductCategories(),
        getMainCategories()
      ]);

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data);
        setFilteredCategories(categoriesResponse.data);
      }

      if (mainCategoriesResponse.success) {
        setMainCategories(mainCategoriesResponse.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Error loading categories');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast.error('Please select image files only');
      return;
    }

    if (imageFiles.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setIsUploading(true);
    try {
      const response = await uploadImages(imageFiles, 'products');
      
      if (response.success) {
        setUploadedImages(prev => [...prev, ...response.data.urls]);
        toast.success(`${imageFiles.length} image(s) uploaded successfully`);
      } else {
        toast.error('Failed to upload images');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading images');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSimilarityCheck = async () => {
    if (!formData.name || !formData.description || !formData.category || !formData.mainCategory) {
      toast.error('Please fill in name, description, category, and main category first');
      return;
    }

    setIsCheckingSimilarity(true);
    try {
      const similarityData: SimilarityCheckRequest = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        mainCategory: formData.mainCategory,
        brand: formData.brand || undefined,
        specifications: formData.specifications,
        imageUrls: uploadedImages,
        businessId,
        threshold: 0.90
      };

      const response = await checkSimilarProducts(similarityData);
      
      if (response.success) {
        setSimilarityResults(response.data);
        setShowSimilarityResults(true);
        
        if (response.data.recommendation === 'use_existing') {
          toast.success('Similar product found! Consider using existing product.');
        } else if (response.data.recommendation === 'review_required') {
          toast.error('Similar products found. Please review before creating.');
        } else {
          toast.success('No similar products found. Safe to create new product.');
        }
      } else {
        toast.error('Error checking similarity');
      }
    } catch (error) {
      console.error('Similarity check error:', error);
      toast.error('Error checking for similar products');
    } finally {
      setIsCheckingSimilarity(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.price || !formData.category || !formData.mainCategory) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUploading(true);
    try {
      const productData: CreateProductRequest = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        stock: formData.stock ? parseInt(formData.stock) : 0,
        category: formData.category,
        mainCategory: formData.mainCategory,
        businessId,
        sku: formData.sku || `${formData.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
        status: formData.status,
        images: uploadedImages,
        brand: formData.brand || undefined,
        specifications: formData.specifications,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        dimensions: formData.dimensions.length && formData.dimensions.width && formData.dimensions.height ? {
          length: parseFloat(formData.dimensions.length),
          width: parseFloat(formData.dimensions.width),
          height: parseFloat(formData.dimensions.height)
        } : undefined,
        tags: formData.tags,
        metadata: formData.metadata
      };

      const response = await createProduct(productData);
      
      if (response.success) {
        toast.success('Product created successfully!');
        onProductCreated?.(response.data);
        onClose?.();
      } else {
        toast.error('Failed to create product');
      }
    } catch (error) {
      console.error('Create product error:', error);
      toast.error('Error creating product');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      cost: '',
      stock: '',
      category: '',
      mainCategory: '',
      sku: '',
      brand: '',
      status: 'active',
      specifications: {},
      weight: '',
      dimensions: { length: '', width: '', height: '' },
      tags: [],
      metadata: {}
    });
    setUploadedImages([]);
    setShowSimilarityResults(false);
    setSimilarityResults(null);
  };

  return (
    <div className="product-upload-overlay">
      <div className="product-upload-modal">
        <div className="upload-header">
          <h2>Upload New Product</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="upload-content">
          {/* Image Upload Section */}
          <div className="upload-section">
            <h3>Product Images</h3>
            <div 
              className={`upload-area ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
                style={{ display: 'none' }}
              />
              
              {isUploading ? (
                <div className="upload-loading">
                  <Loader2 className="animate-spin" size={24} />
                  <p>Uploading images...</p>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <ImageIcon size={48} />
                  <p>Drag & drop images here or click to browse</p>
                  <small>Maximum 5 images, 10MB each</small>
                </div>
              )}
            </div>

            {/* Uploaded Images Preview */}
            {uploadedImages.length > 0 && (
              <div className="uploaded-images">
                <h4>Uploaded Images ({uploadedImages.length}/5)</h4>
                <div className="image-grid">
                  {uploadedImages.map((url, index) => (
                    <div key={index} className="image-preview">
                      <img src={url} alt={`Product ${index + 1}`} />
                      <button 
                        className="remove-image"
                        onClick={() => removeImage(index)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product Form */}
          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-grid">
              {/* Basic Information */}
              <div className="form-section">
                <h3>Basic Information</h3>
                
                <div className="form-group">
                  <label htmlFor="name">Product Name *</label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter product description"
                    rows={3}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="price">Price *</label>
                    <input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cost">Cost</label>
                    <input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => handleInputChange('cost', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="stock">Stock</label>
                    <input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => handleInputChange('stock', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="sku">SKU</label>
                    <input
                      id="sku"
                      type="text"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="form-section">
                <h3>Categories</h3>
                
                <div className="form-group">
                  <label htmlFor="mainCategory">Main Category *</label>
                  <select
                    id="mainCategory"
                    value={selectedMainCategory}
                    onChange={(e) => {
                      setSelectedMainCategory(e.target.value);
                      handleInputChange('mainCategory', e.target.value);
                      handleInputChange('category', ''); // Reset category when main category changes
                    }}
                    required
                  >
                    <option value="">Select main category</option>
                    {mainCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="category">Category *</label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    required
                    disabled={!selectedMainCategory}
                  >
                    <option value="">Select category</option>
                    {filteredCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="brand">Brand</label>
                  <input
                    id="brand"
                    type="text"
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    placeholder="Enter brand name"
                  />
                </div>
              </div>

              {/* Advanced Information */}
              <div className="form-section">
                <h3>Advanced Information</h3>
                
                <div className="form-group">
                  <label htmlFor="weight">Weight (kg)</label>
                  <input
                    id="weight"
                    type="number"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>Dimensions (cm)</label>
                  <div className="dimensions-row">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.dimensions.length}
                      onChange={(e) => handleInputChange('dimensions', {
                        ...formData.dimensions,
                        length: e.target.value
                      })}
                      placeholder="Length"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.dimensions.width}
                      onChange={(e) => handleInputChange('dimensions', {
                        ...formData.dimensions,
                        width: e.target.value
                      })}
                      placeholder="Width"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.dimensions.height}
                      onChange={(e) => handleInputChange('dimensions', {
                        ...formData.dimensions,
                        height: e.target.value
                      })}
                      placeholder="Height"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Similarity Check */}
            <div className="similarity-section">
              <div className="similarity-header">
                <h3>AI Similarity Check</h3>
                <button
                  type="button"
                  className="similarity-btn"
                  onClick={handleSimilarityCheck}
                  disabled={isCheckingSimilarity || !formData.name || !formData.description}
                >
                  {isCheckingSimilarity ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Search size={16} />
                  )}
                  {isCheckingSimilarity ? 'Checking...' : 'Check Similarity'}
                </button>
              </div>

              {showSimilarityResults && similarityResults && (
                <div className="similarity-results">
                  <div className={`similarity-alert ${similarityResults.recommendation}`}>
                    {similarityResults.recommendation === 'use_existing' && (
                      <AlertCircle size={20} />
                    )}
                    {similarityResults.recommendation === 'review_required' && (
                      <AlertCircle size={20} />
                    )}
                    {similarityResults.recommendation === 'create_new' && (
                      <CheckCircle size={20} />
                    )}
                    <span>
                      {similarityResults.recommendation === 'use_existing' && 'Similar product found! Consider using existing product.'}
                      {similarityResults.recommendation === 'review_required' && 'Similar products found. Please review before creating.'}
                      {similarityResults.recommendation === 'create_new' && 'No similar products found. Safe to create new product.'}
                    </span>
                  </div>

                  {similarityResults.similarProducts.length > 0 && (
                    <div className="similar-products">
                      <h4>Similar Products ({similarityResults.similarProducts.length})</h4>
                      <div className="similar-products-list">
                        {similarityResults.similarProducts.map((product, index) => (
                          <div key={product._id} className="similar-product-item">
                            <div className="product-info">
                              <h5>{product.name}</h5>
                              <p>{product.description}</p>
                              <div className="product-meta">
                                <span className="price">${product.price}</span>
                                <span className="category">{product.category}</span>
                              </div>
                            </div>
                            <div className="similarity-score">
                              <span className={`score ${similarityResults.similarityScores[index]?.score > 0.8 ? 'high' : 'medium'}`}>
                                {Math.round(similarityResults.similarityScores[index]?.score * 100)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={resetForm}
                disabled={isUploading}
              >
                Reset Form
              </button>
              
              <button
                type="submit"
                className="btn-primary"
                disabled={isUploading || !formData.name || !formData.description || !formData.price}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Creating Product...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Create Product
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductUpload; 
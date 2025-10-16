# 📊 Frontend Implementation Guide: Article Limit Control

This guide explains how to implement the article limit functionality in your NewsHub frontend application.

## 🎯 Overview

The article limit feature allows users to control how many articles are fetched during import operations. Previously, this was hardcoded to 100 articles, but now users can specify any limit between 1-1000 articles.

## 🔧 Implementation

### 1. **Import Form Component**

Add an article limit input field to your import form:

```tsx
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ImportForm({ projectId }: { projectId: string }) {
  const [articleLimit, setArticleLimit] = useState(100);
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleImport = async () => {
    const response = await fetch('/api/import/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        searchTerms,
        startDate,
        endDate,
        articleLimit // This is the new parameter
      })
    });

    const result = await response.json();
    // Handle response...
  };

  return (
    <form onSubmit={handleImport}>
      {/* Existing form fields */}
      
      <div className="space-y-2">
        <Label htmlFor="articleLimit">Article Limit</Label>
        <Input
          id="articleLimit"
          type="number"
          min="1"
          max="1000"
          value={articleLimit}
          onChange={(e) => setArticleLimit(parseInt(e.target.value) || 100)}
          placeholder="100"
        />
        <p className="text-sm text-muted-foreground">
          Maximum number of articles to import (1-1000)
        </p>
      </div>
      
      <Button type="submit">Start Import</Button>
    </form>
  );
}
```

### 2. **Preview Import Component**

Update your preview functionality to include the article limit:

```tsx
export function ImportPreview({ projectId }: { projectId: string }) {
  const [articleLimit, setArticleLimit] = useState(100);
  const [preview, setPreview] = useState(null);

  const handlePreview = async () => {
    const response = await fetch('/api/import/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        searchTerms: ['your search terms'],
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        articleLimit // Include in preview request
      })
    });

    const result = await response.json();
    setPreview(result.data);
  };

  return (
    <div>
      {/* Article limit input */}
      <div className="mb-4">
        <Label>Article Limit</Label>
        <Input
          type="number"
          min="1"
          max="1000"
          value={articleLimit}
          onChange={(e) => setArticleLimit(parseInt(e.target.value) || 100)}
        />
      </div>

      <Button onClick={handlePreview}>Preview Import</Button>
      
      {preview && (
        <div className="mt-4 p-4 border rounded">
          <h3>Import Preview</h3>
          <p>Estimated articles: {preview.estimatedArticles}</p>
          <p>Limit applied: {articleLimit}</p>
        </div>
      )}
    </div>
  );
}
```

### 3. **Form Validation**

Add client-side validation for the article limit:

```tsx
const validateArticleLimit = (limit: number): string | null => {
  if (limit < 1) return 'Article limit must be at least 1';
  if (limit > 1000) return 'Article limit cannot exceed 1000';
  if (!Number.isInteger(limit)) return 'Article limit must be a whole number';
  return null;
};

// Use in your form
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  const limitError = validateArticleLimit(articleLimit);
  if (limitError) {
    setError(limitError);
    return;
  }
  
  // Proceed with import...
};
```

### 4. **UI Components**

#### **Slider Alternative**
For a more visual approach, use a slider:

```tsx
import { Slider } from '@/components/ui/slider';

export function ArticleLimitSlider({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="space-y-2">
      <Label>Article Limit: {value}</Label>
      <Slider
        value={[value]}
        onValueChange={([newValue]) => onChange(newValue)}
        min={1}
        max={1000}
        step={1}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>1</span>
        <span>1000</span>
      </div>
    </div>
  );
}
```

#### **Preset Buttons**
Provide quick preset options:

```tsx
export function ArticleLimitPresets({ onSelect }: { onSelect: (limit: number) => void }) {
  const presets = [25, 50, 100, 200, 500];

  return (
    <div className="flex gap-2">
      {presets.map(limit => (
        <Button
          key={limit}
          variant="outline"
          size="sm"
          onClick={() => onSelect(limit)}
        >
          {limit}
        </Button>
      ))}
    </div>
  );
}
```

## 📋 **API Reference**

### **Request Format**
```json
{
  "projectId": "uuid",
  "searchTerms": ["climate change", "COP30"],
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "articleLimit": 50
}
```

### **Endpoints**
- `POST /import/preview` - Preview with article limit
- `POST /import/start` - Start import with article limit

### **Response Format**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "status": "running"
  },
  "error": null
}
```

## 🎨 **Design Considerations**

### **Default Values**
- **Recommended default**: 100 articles
- **Minimum**: 1 article
- **Maximum**: 1000 articles

### **User Experience**
- Show current limit in import status
- Display progress as "X of Y articles imported"
- Allow changing limit before starting import

### **Error Handling**
```tsx
const handleImportError = (error: any) => {
  if (error.message.includes('article limit')) {
    setError('Invalid article limit. Please choose between 1-1000.');
  } else {
    setError('Import failed. Please try again.');
  }
};
```

## ✅ **Testing Checklist**

- [ ] Article limit input accepts numbers 1-1000
- [ ] Invalid limits show validation errors
- [ ] Preview shows correct estimated count
- [ ] Import respects the specified limit
- [ ] Progress indicators show correct totals
- [ ] Error handling works for invalid limits

## 🚀 **Quick Start**

1. Add `articleLimit` state to your import form
2. Include `articleLimit` in API requests
3. Add input validation
4. Test with different limit values
5. Update progress indicators to show limit

The article limit functionality is now fully supported by the backend API! 🎉

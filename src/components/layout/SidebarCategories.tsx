"use client"

import { useEffect, useState, useRef } from "react"
import { MoreVertical, Plus, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCategory, deleteCategory, updateCategory } from "@/actions/categories"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  color: string | null
  user_id: string
}

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
]

export function SidebarCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  
  // Form states
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState("")
  const [editCategoryName, setEditCategoryName] = useState("")
  const [editCategoryColor, setEditCategoryColor] = useState("")
  
  // Color picker refs
  const newColorInputRef = useRef<HTMLInputElement>(null)
  const editColorInputRef = useRef<HTMLInputElement>(null)
  
  // Track if color picker is open to prevent dialog close
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)

  const fetchCategories = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return
    
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
    
    if (!error && data) {
      setCategories(data)
      // Select all categories by default
      setSelectedCategories(new Set(data.map(c => c.id)))
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const handleCreate = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required")
      return
    }
    
    setIsSubmitting(true)
    try {
      const result = await createCategory({ 
        name: newCategoryName.trim(), 
        color: newCategoryColor 
      })
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Category created")
        setCreateDialogOpen(false)
        setNewCategoryName("")
        setNewCategoryColor("")
        await fetchCategories()
      }
    } catch (error) {
      toast.error("Failed to create category")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedCategory || !editCategoryName.trim()) {
      toast.error("Category name is required")
      return
    }
    
    setIsSubmitting(true)
    try {
      const result = await updateCategory(selectedCategory.id, { 
        name: editCategoryName.trim(), 
        color: editCategoryColor 
      })
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Category updated")
        setEditDialogOpen(false)
        setSelectedCategory(null)
        await fetchCategories()
      }
    } catch (error) {
      toast.error("Failed to update category")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedCategory) return
    
    setIsSubmitting(true)
    try {
      const result = await deleteCategory(selectedCategory.id)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Category deleted")
        setDeleteDialogOpen(false)
        setSelectedCategory(null)
        await fetchCategories()
      }
    } catch (error) {
      toast.error("Failed to delete category")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category)
    setEditCategoryName(category.name)
    setEditCategoryColor(category.color || "#3b82f6")
    setEditDialogOpen(true)
  }

  const openDetailDialog = (category: Category) => {
    setSelectedCategory(category)
    setDetailDialogOpen(true)
  }

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category)
    setDeleteDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="px-4 py-2">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-1">
        <div className="flex items-center justify-between mb-2 px-4">
          <h2 className="text-xs font-semibold tracking-tight text-muted-foreground uppercase">
            Categories
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        
        {categories.length === 0 ? (
          <p className="text-xs text-muted-foreground px-4 py-2">No categories yet</p>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="group flex items-center px-4 py-2 hover:bg-primary/5 rounded-lg transition-colors"
            >
              <Checkbox
                id={`category-${category.id}`}
                checked={selectedCategories.has(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
                className="mr-3"
              />
              <div
                className="h-3 w-3 rounded-full mr-2 flex-shrink-0"
                style={{ backgroundColor: category.color || "#ccc" }}
              />
              <label
                htmlFor={`category-${category.id}`}
                className="text-sm flex-1 cursor-pointer truncate"
              >
                {category.name}
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem onClick={() => openDetailDialog(category)}>
                    Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openEditDialog(category)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => openDeleteDialog(category)}
                    className="text-red-600 focus:text-red-600"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      {/* Create Category Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        if (!isColorPickerOpen) setCreateDialogOpen(open)
      }}>
        <DialogContent 
          className="sm:max-w-[400px]"
          onInteractOutside={(e) => {
            if (isColorPickerOpen) e.preventDefault()
          }}
        >
          <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Color <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((presetColor) => (
                    <button
                      key={presetColor}
                      type="button"
                      className={cn(
                        "w-8 h-8 rounded-full ring-offset-background transition-all shrink-0",
                        newCategoryColor === presetColor && "ring-2 ring-ring ring-offset-2"
                      )}
                      style={{ backgroundColor: presetColor }}
                      onClick={() => setNewCategoryColor(presetColor)}
                    />
                  ))}
                  <div className="relative w-8 h-8">
                    <input
                      ref={newColorInputRef}
                      type="color"
                      value={newCategoryColor || "#3b82f6"}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      onFocus={() => setIsColorPickerOpen(true)}
                      onBlur={() => setIsColorPickerOpen(false)}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                    <button
                      type="button"
                      className={cn(
                        "w-8 h-8 rounded-full ring-offset-background transition-all shrink-0",
                        newCategoryColor && !PRESET_COLORS.includes(newCategoryColor) && "ring-2 ring-ring ring-offset-2"
                      )}
                      style={{ 
                        background: newCategoryColor && !PRESET_COLORS.includes(newCategoryColor) 
                          ? newCategoryColor 
                          : "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)"
                      }}
                      onClick={() => newColorInputRef.current?.click()}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        if (!isColorPickerOpen) setEditDialogOpen(open)
      }}>
        <DialogContent 
          className="sm:max-w-[400px]"
          onInteractOutside={(e) => {
            if (isColorPickerOpen) e.preventDefault()
          }}
        >
          <form onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  placeholder="Category name"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((presetColor) => (
                    <button
                      key={presetColor}
                      type="button"
                      className={cn(
                        "w-8 h-8 rounded-full ring-offset-background transition-all shrink-0",
                        editCategoryColor === presetColor && "ring-2 ring-ring ring-offset-2"
                      )}
                      style={{ backgroundColor: presetColor }}
                      onClick={() => setEditCategoryColor(presetColor)}
                    />
                  ))}
                  <div className="relative w-8 h-8">
                    <input
                      ref={editColorInputRef}
                      type="color"
                      value={editCategoryColor}
                      onChange={(e) => setEditCategoryColor(e.target.value)}
                      onFocus={() => setIsColorPickerOpen(true)}
                      onBlur={() => setIsColorPickerOpen(false)}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                    <button
                      type="button"
                      className={cn(
                        "w-8 h-8 rounded-full ring-offset-background transition-all shrink-0",
                        !PRESET_COLORS.includes(editCategoryColor) && "ring-2 ring-ring ring-offset-2"
                      )}
                      style={{ 
                        background: !PRESET_COLORS.includes(editCategoryColor) 
                          ? editCategoryColor 
                          : "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)"
                      }}
                      onClick={() => editColorInputRef.current?.click()}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Category Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Category Details</DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-full"
                  style={{ backgroundColor: selectedCategory.color || "#ccc" }}
                />
                <div>
                  <p className="font-medium">{selectedCategory.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Color: {selectedCategory.color || "Not set"}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <form onSubmit={(e) => { e.preventDefault(); handleDelete(); }}>
            <DialogHeader>
              <DialogTitle>Delete Category</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{selectedCategory?.name}&quot;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

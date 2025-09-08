"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Plus, Search, Filter, Edit, Trash2, PieChart, ArrowUpIcon, ArrowDownIcon, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function DashboardSection() {
  // State management
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, currentBalance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  // Form state for adding/editing transactions
  const [formData, setFormData] = useState({
    type: "expense",
    amount: "",
    description: "",
    category: "",
    date: new Date()
  });

  // Form state for adding categories
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    color: "#ff6b6b"
  });

  // Auth headers helper
  const getAuthHeaders = () => {
    const token = localStorage.getItem("bearer_token");
    if (!token) {
      return null;
    }
    
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  };

  // Handle 401 responses
  const handleUnauthorized = () => {
    localStorage.removeItem("bearer_token");
    toast.error("Session expired. Please log in again.");
    window.dispatchEvent(new CustomEvent("authChanged", { 
      detail: { isAuthenticated: false } 
    }));
  };

  // API calls
  const fetchData = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      setIsLoading(true);
      const [summaryRes, transactionsRes, categoriesRes] = await Promise.all([
        fetch("/api/summary", { headers }),
        fetch("/api/transactions", { headers }),
        fetch("/api/categories", { headers })
      ]);

      if (summaryRes.status === 401 || transactionsRes.status === 401 || categoriesRes.status === 401) {
        handleUnauthorized();
        return;
      }

      if (summaryRes.ok && transactionsRes.ok && categoriesRes.ok) {
        const [summaryData, transactionsData, categoriesData] = await Promise.all([
          summaryRes.json(),
          transactionsRes.json(),
          categoriesRes.json()
        ]);

        console.log("Fetched data:", { summaryData, transactionsData, categoriesData });
        setSummary(summaryData);
        setTransactions(transactionsData);
        setCategories(categoriesData);
      } else {
        toast.error("Failed to load data");
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const addTransaction = async (transactionData) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: transactionData.type,
          amount: parseFloat(transactionData.amount),
          title: transactionData.description,
          category: transactionData.category,
          date: transactionData.date.toISOString().split('T')[0]
        })
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.ok) {
        toast.success("Transaction added successfully!");
        fetchData(); // Refresh data
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add transaction");
      }
    } catch (error) {
      console.error("Failed to add transaction:", error);
      toast.error("Failed to add transaction");
    }
  };

  const addCategory = async (categoryData) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: categoryData.name,
          color: categoryData.color
        })
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.ok) {
        toast.success("Category added successfully!");
        fetchData(); // Refresh data
        setIsAddCategoryDialogOpen(false);
        setCategoryFormData({ name: "", color: "#ff6b6b" });
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add category");
      }
    } catch (error) {
      console.error("Failed to add category:", error);
      toast.error("Failed to add category");
    }
  };

  const updateTransaction = async (id, transactionData) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          type: transactionData.type,
          amount: parseFloat(transactionData.amount),
          title: transactionData.description,
          category: transactionData.category,
          date: transactionData.date.toISOString().split('T')[0]
        })
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.ok) {
        toast.success("Transaction updated successfully!");
        fetchData(); // Refresh data
        setEditingTransaction(null);
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update transaction");
      }
    } catch (error) {
      console.error("Failed to update transaction:", error);
      toast.error("Failed to update transaction");
    }
  };

  const deleteTransaction = async (id) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
        headers
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.ok) {
        toast.success("Transaction deleted successfully!");
        fetchData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete transaction");
      }
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      toast.error("Failed to delete transaction");
    }
  };

  // Form handlers
  const resetForm = () => {
    setFormData({
      type: "expense",
      amount: "",
      description: "",
      category: "",
      date: new Date()
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, formData);
    } else {
      addTransaction(formData);
    }
  };

  const handleCategoryFormSubmit = (e) => {
    e.preventDefault();
    
    if (!categoryFormData.name) {
      toast.error("Please enter a category name");
      return;
    }

    addCategory(categoryFormData);
  };

  const startEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.title,
      category: transaction.category,
      date: new Date(transaction.date)
    });
    setIsAddDialogOpen(true);
  };

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(transaction => {
      const matchesSearch = transaction.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || transaction.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.date) - new Date(a.date);
        case "amount":
          return b.amount - a.amount;
        case "description":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${summary.totalIncome?.toLocaleString() || "0"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${summary.totalExpenses?.toLocaleString() || "0"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              summary.currentBalance >= 0 ? "text-green-600" : "text-red-600"
            )}>
              ${summary.currentBalance?.toLocaleString() || "0"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Add Transaction & Transaction List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Transaction Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Transaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" onClick={() => {
                    resetForm();
                    setEditingTransaction(null);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Transaction
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTransaction ? "Edit Transaction" : "Add New Transaction"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="Enter description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={categories.length > 0 ? "Select category" : "No categories available"} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.length > 0 ? (
                            categories
                              .filter(category => category.name && category.name.trim() !== "")
                              .map((category) => (
                                <SelectItem key={category.id} value={category.name}>
                                  {category.name}
                                </SelectItem>
                              ))
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground">
                              No categories available. Add a category first.
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.date}
                            onSelect={(date) => setFormData({ ...formData, date: date || new Date() })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <Button type="submit" className="w-full">
                      {editingTransaction ? "Update Transaction" : "Add Transaction"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Transaction List Card */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories
                      .filter(category => category.name && category.name.trim() !== "")
                      .map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="description">Description</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTransactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {transactions.length === 0 ? "No transactions yet. Add your first transaction!" : "No transactions found."}
                  </p>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const category = categories.find(c => c.name === transaction.category);
                    return (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={cn(
                            "w-2 h-12 rounded-full",
                            transaction.type === "income" ? "bg-green-500" : "bg-red-500"
                          )} />
                          <div>
                            <p className="font-medium">{transaction.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">{transaction.category}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(transaction.date), "MMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={cn(
                            "font-semibold",
                            transaction.type === "income" ? "text-green-600" : "text-red-600"
                          )}>
                            {transaction.type === "income" ? "+" : "-"}${transaction.amount.toLocaleString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditTransaction(transaction)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this transaction?")) {
                                deleteTransaction(transaction.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Categories */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Categories
                </CardTitle>
                <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New Category</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCategoryFormSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="categoryName">Category Name</Label>
                        <Input
                          id="categoryName"
                          placeholder="Enter category name"
                          value={categoryFormData.name}
                          onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="categoryColor">Category Color</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="categoryColor"
                            type="color"
                            value={categoryFormData.color}
                            onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                            className="w-16 h-10"
                          />
                          <span className="text-sm text-muted-foreground">{categoryFormData.color}</span>
                        </div>
                      </div>

                      <Button type="submit" className="w-full">
                        Add Category
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categories.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No categories yet. Add your first category!
                  </p>
                ) : (
                  categories.map((category) => {
                    const categoryTransactions = transactions.filter(t => t.category === category.name);
                    const categoryTotal = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
                    
                    return (
                      <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${categoryTotal.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {categoryTransactions.length} transactions
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
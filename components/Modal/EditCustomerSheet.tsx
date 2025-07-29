"use client"

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { customerServer, type Customer, type CustomerFormData } from "@/lib/CustomerServer";
import { auditServer } from "@/lib/AuditServer";

interface EditCustomerModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditCustomerModal({ customer, isOpen, onOpenChange, onSuccess }: EditCustomerModalProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    first_name: "",
    middle_name: "",
    last_name: "",
    contact: "",
    address: "",
    birthdate: "",
    email: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const { addToast } = useToast();

  // Update form data when customer changes
  useEffect(() => {
    if (customer) {
      setFormData({
        first_name: customer.first_name,
        middle_name: customer.middle_name || "",
        last_name: customer.last_name,
        contact: customer.contact,
        address: customer.address,
        birthdate: customer.birthdate,
        email: customer.email
      });
      setDate(customer.birthdate ? new Date(customer.birthdate) : undefined);
    }
  }, [customer]);

  const resetForm = () => {
    if (customer) {
      setFormData({
        first_name: customer.first_name,
        middle_name: customer.middle_name || "",
        last_name: customer.last_name,
        contact: customer.contact,
        address: customer.address,
        birthdate: customer.birthdate,
        email: customer.email
      });
      setDate(customer.birthdate ? new Date(customer.birthdate) : undefined);
    }
  };

  const validateForm = (data: CustomerFormData): boolean => {
    if (!data.first_name.trim()) {
      addToast({ type: "error", message: "First name is required" });
      return false;
    }
    if (!data.last_name.trim()) {
      addToast({ type: "error", message: "Last name is required" });
      return false;
    }
    if (!data.contact.trim()) {
      addToast({ type: "error", message: "Contact number is required" });
      return false;
    }
    if (!data.email.trim()) {
      addToast({ type: "error", message: "Email is required" });
      return false;
    }
    if (!date) {
      addToast({ type: "error", message: "Birthdate is required" });
      return false;
    }
    if (!data.address.trim()) {
      addToast({ type: "error", message: "Address is required" });
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      addToast({ type: "error", message: "Please enter a valid email address" });
      return false;
    }

    // Contact number validation (basic)
    const contactRegex = /^\d{11}$/;
    if (!contactRegex.test(data.contact.replace(/\D/g, ''))) {
      addToast({ type: "error", message: "Please enter a valid 11-digit contact number" });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customer) {
      addToast({ 
        type: "error", 
        message: "No customer selected for editing",
        title: "Error"
      });
      return;
    }

    if (!customer.customer_id) {
      addToast({ 
        type: "error", 
        message: "Customer ID is missing",
        title: "Error"
      });
      return;
    }
    
    if (!validateForm(formData)) {
      return;
    }

    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        customer_id: customer.customer_id,
        birthdate: date ? format(date, 'yyyy-MM-dd') : ''
      };

      const updatedCustomer = await customerServer.updateCustomer(submitData);

      try {
        await auditServer.logCustomerAction(
          1, 
          'admin', 
          'update',
          typeof customer.customer_id === 'string' ? parseInt(customer.customer_id) : customer.customer_id,
          `Customer updated: ${submitData.first_name} ${submitData.last_name}`
        );
      } catch (auditError) {
        console.error('Failed to log audit trail:', auditError);
      }

      addToast({ 
        type: "success", 
        message: "Customer updated successfully!",
        title: "Success"
      });

      // Call the optional onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);

    } catch (err: unknown) {
      if (err instanceof Error) {
        addToast({ 
          type: "error", 
          message: err.message,
          title: "Error"
        });
      } else {
        addToast({ 
          type: "error", 
          message: "An unexpected error occurred while updating the customer",
          title: "Error"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>
            Update the customer information below. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editFirstName">First Name *</Label>
              <Input 
                id="editFirstName" 
                placeholder="John" 
                value={formData.first_name}
                onChange={(e) => handleInputChange("first_name", e.target.value)}
                disabled={isLoading}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editMiddleName">Middle Name</Label>
              <Input 
                id="editMiddleName" 
                placeholder="Doe"
                value={formData.middle_name}
                onChange={(e) => handleInputChange("middle_name", e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editLastName">Last Name *</Label>
              <Input 
                id="editLastName" 
                placeholder="Doe"
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                disabled={isLoading}
                required 
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editContact">Contact Number *</Label>
              <Input 
                id="editContact" 
                type="tel" 
                placeholder="09123456789"
                value={formData.contact}
                onChange={(e) => handleInputChange("contact", e.target.value)}
                disabled={isLoading}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email *</Label>
              <Input 
                id="editEmail" 
                type="email" 
                placeholder="sample@gmail.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={isLoading}
                required 
              />
            </div>
          </div>

          {/* Birthdate */}
          <div className="space-y-2">
            <Label htmlFor="editBirthdate">Birthdate *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  captionLayout="dropdown"
                  fromYear={1900}
                  toYear={new Date().getFullYear()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="editAddress">Address *</Label>
            <Textarea 
              id="editAddress" 
              placeholder="Sample Address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              rows={3}
              disabled={isLoading}
              required 
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Customer"
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
"use client"

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, CalendarIcon } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { customerServer, type CustomerFormData } from "@/lib/CustomerServer";
import { auditServer } from "@/lib/AuditServer";

interface AddCustomerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: CustomerFormData) => void;
  onSuccess?: () => void;
}

export function AddCustomerModal({ isOpen, onOpenChange, onSubmit, onSuccess }: AddCustomerModalProps) {
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

  const resetForm = () => {
    setFormData({
      first_name: "",
      middle_name: "",
      last_name: "",
      contact: "",
      address: "",
      birthdate: "",
      email: ""
    });
    setDate(undefined);
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
    
    if (!validateForm(formData)) {
      return;
    }

    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        birthdate: date ? format(date, 'yyyy-MM-dd') : ''
      };

      // Create the customer
      const newCustomer = await customerServer.createCustomer(submitData);

      // Log the audit trail
      try {
        await auditServer.logCustomerAction(
          1, // actor_id - you might want to get this from user context
          'admin', // actor_role - you might want to get this from user context
          'create',
          typeof newCustomer.customer_id === 'string' ? parseInt(newCustomer.customer_id) : newCustomer.customer_id,
          `New customer created: ${submitData.first_name} ${submitData.last_name}`,
        );
      } catch (auditError) {
        // Log audit error but don't fail the customer creation
        console.error('Failed to log audit trail:', auditError);
      }

      addToast({ 
        type: "success", 
        message: "Customer added successfully!",
        title: "Success"
      });
      
      // Call the optional onSubmit callback if provided
      if (onSubmit) {
        onSubmit(submitData);
      }

      // Call the optional onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      resetForm();
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
          message: "An unexpected error occurred while adding the customer",
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Fill in the customer information below. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input 
                id="firstName" 
                placeholder="John" 
                value={formData.first_name}
                onChange={(e) => handleInputChange("first_name", e.target.value)}
                disabled={isLoading}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName">Middle Name</Label>
              <Input 
                id="middleName" 
                placeholder="Doe"
                value={formData.middle_name}
                onChange={(e) => handleInputChange("middle_name", e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input 
                id="lastName" 
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
              <Label htmlFor="contact">Contact Number *</Label>
              <Input 
                id="contact" 
                type="tel" 
                placeholder="09123456789"
                value={formData.contact}
                onChange={(e) => handleInputChange("contact", e.target.value)}
                disabled={isLoading}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email" 
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
            <Label htmlFor="birthdate">Birthdate *</Label>
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
            <Label htmlFor="address">Address *</Label>
            <Textarea 
              id="address" 
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
                  Saving...
                </>
              ) : (
                "Save Customer"
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
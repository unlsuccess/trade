"use client";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  title: string;
  price: number;
  seller_id: string;
}

export default function PurchaseButton({ product }: { product: Product }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handlePurchase() {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Check if user is a buyer
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'buyer') {
        toast.error("Only buyers can make purchases");
        return;
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          product_id: product.id,
          buyer_id: user.id,
          seller_id: product.seller_id,
          amount: product.price,
          status: 'pending'
        });

      if (transactionError) throw transactionError;

      // Update product status
      const { error: productError } = await supabase
        .from('products')
        .update({ status: 'pending' })
        .eq('id', product.id);

      if (productError) throw productError;

      // In a real app, integrate Mono payment here
      toast.success("Purchase initiated! Check your dashboard for status.");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button 
      onClick={handlePurchase} 
      disabled={loading}
      className="w-full"
    >
      {loading ? "Processing..." : "Buy Now"}
    </Button>
  );
}
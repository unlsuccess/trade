"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Package, ShoppingBag, Wallet, LogOut } from "lucide-react";
import Link from "next/link";

interface UserProfile {
  id: string;
  email: string;
  role: 'buyer' | 'seller';
  wallet_balance: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    getUser();
    getRecentTransactions();
  }, []);

  async function getUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();
      
      setUser({ ...authUser, ...profile });
    }
  }

  async function getRecentTransactions() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data } = await supabase
        .from('transactions')
        .select(`
          *,
          products:product_id (title, price),
          buyers:buyer_id (email),
          sellers:seller_id (email)
        `)
        .or(`buyer_id.eq.${authUser.id},seller_id.eq.${authUser.id}`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) setRecentTransactions(data);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    router.push("/");
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button onClick={handleSignOut} variant="ghost">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <p className="text-2xl font-bold capitalize">{user.role}</p>
              </div>
              {user.role === 'buyer' ? (
                <ShoppingBag className="w-8 h-8 text-primary" />
              ) : (
                <Package className="w-8 h-8 text-primary" />
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-2xl font-bold">{user.email}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Wallet Balance</p>
                <p className="text-2xl font-bold">${user.wallet_balance}</p>
              </div>
              <Wallet className="w-8 h-8 text-primary" />
            </div>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Buyer View */}
          {user.role === 'buyer' && (
            <>
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="space-y-4">
                  <Button asChild className="w-full">
                    <Link href="/products">Browse Products</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard/transactions">View Purchases</Link>
                  </Button>
                </div>
              </Card>
            </>
          )}

          {/* Seller View */}
          {user.role === 'seller' && (
            <>
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Seller Actions</h2>
                <div className="space-y-4">
                  <Button asChild className="w-full">
                    <Link href="/dashboard/products/new">Create New Listing</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard/transactions">View Sales</Link>
                  </Button>
                </div>
              </Card>
            </>
          )}

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
            <div className="space-y-4">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction: any) => (
                  <div
                    key={transaction.id}
                    className="flex justify-between items-center p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{transaction.products.title}</p>
                      <p className="text-sm text-muted-foreground">
                        ${transaction.products.price}
                      </p>
                    </div>
                    <span
                      className="px-2 py-1 text-xs rounded-full"
                      style={{
                        backgroundColor:
                          transaction.status === 'completed'
                            ? 'var(--success)'
                            : transaction.status === 'in_escrow'
                            ? 'var(--warning)'
                            : 'var(--muted)',
                        color: 'white',
                      }}
                    >
                      {transaction.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No recent transactions
                </p>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
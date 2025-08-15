/**
 * Example: How to use the Dashboard feature components
 */

import React from 'react';
import { DashboardLayout } from "@/features/dashboard";
import { Header, useHeader } from "@/features/header";
import { Badge } from "@/components/ui";

// Example 1: Using the Header component standalone
export function HeaderExample() {
  return (
    <Header
      title="Dashboard"
      onMenuToggle={() => console.log("Toggle menu")}
      showSearch={true}
      notificationCount={5}
      breadcrumbs={[
        { label: "Home", href: "/dashboard" },
        { label: "Users", href: "/dashboard/users" },
        { label: "Profile" }
      ]}
    />
  );
}

// Example 2: Using hooks in a custom component
export function CustomNotificationBell() {
  const { unreadCount, markAllAsRead } = useHeader();
  
  return (
    <button onClick={markAllAsRead} className="relative p-2">
      <Badge variant="error" pulse>
        {unreadCount}
      </Badge>
      {/* Your custom bell icon */}
    </button>
  );
}

// Example 3: Using the search hook
export function CustomSearchBar() {
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };
  
  return (
    <form onSubmit={handleSearch}>
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search..."
      />
    </form>
  );
}

// Example 4: Full page with DashboardLayout
export function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold">Welcome to Dashboard</h1>
        <p>Your content here...</p>
      </div>
    </DashboardLayout>
  );
}
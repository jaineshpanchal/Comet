"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UserIcon,
  Cog6ToothIcon,
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  UsersIcon,
  LinkIcon,
  TrashIcon,
  PlusIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

interface Integration {
  id: string;
  name: string;
  type: "github" | "gitlab" | "jira" | "slack" | "jenkins" | "sonarqube";
  status: "connected" | "disconnected" | "error";
  lastSync?: Date;
  config: Record<string, any>;
}

interface NotificationSetting {
  id: string;
  name: string;
  description: string;
  email: boolean;
  slack: boolean;
  inApp: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<string>("profile");

  // Mock data
  const integrations: Integration[] = [
    {
      id: "1",
      name: "GitHub Repository",
      type: "github",
      status: "connected",
      lastSync: new Date("2024-01-15T11:30:00"),
      config: {
        repository: "comet-org/comet-platform",
        webhooks: true,
      },
    },
    {
      id: "2",
      name: "JIRA Project",
      type: "jira",
      status: "connected",
      lastSync: new Date("2024-01-15T10:45:00"),
      config: {
        server: "https://comet.atlassian.net",
        project: "COMET",
      },
    },
    {
      id: "3",
      name: "Slack Workspace",
      type: "slack",
      status: "disconnected",
      config: {
        channel: "#devops",
      },
    },
    {
      id: "4",
      name: "Jenkins Server",
      type: "jenkins",
      status: "error",
      lastSync: new Date("2024-01-14T16:20:00"),
      config: {
        server: "https://jenkins.comet.com",
      },
    },
  ];

  const notificationSettings: NotificationSetting[] = [
    {
      id: "1",
      name: "Pipeline Status",
      description: "Notifications when pipelines start, complete, or fail",
      email: true,
      slack: true,
      inApp: true,
    },
    {
      id: "2",
      name: "Deployment Events",
      description: "Notifications for successful and failed deployments",
      email: true,
      slack: false,
      inApp: true,
    },
    {
      id: "3",
      name: "Test Results",
      description: "Notifications for test failures and coverage reports",
      email: false,
      slack: true,
      inApp: true,
    },
    {
      id: "4",
      name: "Security Alerts",
      description: "Critical security vulnerabilities and alerts",
      email: true,
      slack: true,
      inApp: true,
    },
    {
      id: "5",
      name: "System Monitoring",
      description: "Performance alerts and system health notifications",
      email: false,
      slack: true,
      inApp: true,
    },
  ];

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case "github":
        return <GlobeAltIcon className="w-5 h-5" />;
      case "jira":
        return <Cog6ToothIcon className="w-5 h-5" />;
      case "slack":
        return <BellIcon className="w-5 h-5" />;
      case "jenkins":
        return <LinkIcon className="w-5 h-5" />;
      default:
        return <LinkIcon className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      connected: "success" as const,
      disconnected: "secondary" as const,
      error: "destructive" as const,
    };
    return variants[status as keyof typeof variants] || "secondary";
  };

  const tabs = [
    { id: "profile", name: "Profile", icon: UserIcon },
    { id: "notifications", name: "Notifications", icon: BellIcon },
    { id: "integrations", name: "Integrations", icon: LinkIcon },
    { id: "security", name: "Security", icon: ShieldCheckIcon },
    { id: "team", name: "Team", icon: UsersIcon },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      defaultValue="John"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Doe"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    defaultValue="john.doe@comet.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                    <option value="developer">Developer</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="tester">Tester</option>
                  </select>
                </div>
                
                <div className="flex space-x-3">
                  <Button>Save Changes</Button>
                  <Button variant="outline">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {notificationSettings.map((setting) => (
                    <div key={setting.id} className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">{setting.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{setting.description}</p>
                      </div>
                      <div className="flex items-center space-x-6 ml-6">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            defaultChecked={setting.email}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Email</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            defaultChecked={setting.slack}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Slack</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            defaultChecked={setting.inApp}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">In-App</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4">
                    <Button>Save Notification Settings</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "integrations":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Integrations</h2>
                <p className="text-gray-600 dark:text-gray-400">Connect external tools and services</p>
              </div>
              <Button>
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Integration
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {integrations.map((integration) => (
                <Card key={integration.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          {getIntegrationIcon(integration.type)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{integration.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{integration.type}</p>
                        </div>
                      </div>
                      <Badge variant={getStatusBadge(integration.status)}>
                        {integration.status}
                      </Badge>
                    </div>
                    
                    {integration.lastSync && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Last sync: {integration.lastSync.toLocaleString()}
                      </p>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <PencilIcon className="w-4 h-4 mr-1" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm">
                        <TrashIcon className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security and access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <Button>Update Password</Button>
                  </div>
                </div>
                
                <hr className="border-gray-200 dark:border-gray-700" />
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Enable 2FA</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Add an extra layer of security to your account</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary">Disabled</Badge>
                      <Button variant="outline" size="sm">Enable</Button>
                    </div>
                  </div>
                </div>
                
                <hr className="border-gray-200 dark:border-gray-700" />
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">API Keys</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Production API Key</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Created on Jan 10, 2024</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">Regenerate</Button>
                        <Button variant="outline" size="sm">
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Button variant="outline">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Generate New API Key
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "team":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Management</h2>
                <p className="text-gray-600 dark:text-gray-400">Manage team members and their permissions</p>
              </div>
              <Button>
                <PlusIcon className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Member
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Last Active
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {[
                        { name: "John Doe", email: "john@comet.com", role: "Admin", lastActive: "2 hours ago" },
                        { name: "Jane Smith", email: "jane@comet.com", role: "Developer", lastActive: "1 day ago" },
                        { name: "Mike Johnson", email: "mike@comet.com", role: "Tester", lastActive: "3 days ago" },
                      ].map((member, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{member.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="secondary">{member.role}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {member.lastActive}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Button variant="outline" size="sm">Edit</Button>
                            <Button variant="outline" size="sm">Remove</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account, team, and application preferences
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 pb-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}
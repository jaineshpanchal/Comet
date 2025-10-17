"use client"

import { useState, useEffect } from "react"
import { useToast } from '@/components/ui/toast'
import { useAuthGuard } from '@/lib/useAuthGuard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreateProjectModal } from "@/components/modals/create-project-modal"
import { Plus, Search, Filter, GitBranch, Calendar, Users, Settings } from "lucide-react"


interface Project {
  id: string
  name: string
  description: string
  repository: string
  branch: string
  technology: string
  visibility: string
  createdAt: Date
  pipelinesCount?: number
  testsCount?: number
  deploymentsCount?: number
  team?: string
  lastActivity?: Date
}

export default function ProjectsPage() {
  useAuthGuard();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/projects");
        if (!res.ok) throw new Error("Failed to fetch projects");
        const data = await res.json();
        setProjects(
          (data.projects || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            repository: p.repository || "",
            branch: p.branch || "main",
            technology: p.technology || "nodejs",
            visibility: p.visibility || "private",
            createdAt: p.created_at ? new Date(p.created_at) : new Date(),
            pipelinesCount: p.pipelinesCount,
            testsCount: p.testsCount,
            deploymentsCount: p.deploymentsCount,
            team: p.team,
            lastActivity: p.lastActivity ? new Date(p.lastActivity) : undefined,
          }))
        );
      } catch (err: any) {
        setError(err.message || "Unknown error");
        showToast(err.message || "Unknown error", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [showToast]);
  const techIcons: Record<string, string> = {
    nodejs: "🟢",
    python: "🐍",
    java: "☕",
    go: "🔵",
    dotnet: "💜",
    ruby: "💎",
  }
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTech, setFilterTech] = useState<string>("all")

  const handleCreateProject = (newProject: Project) => {
    setProjects([newProject, ...projects]);
    showToast("Project created successfully!", "success");
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTech = filterTech === "all" || project.technology === filterTech

    return matchesSearch && matchesTech
  })

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000)

    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return new Date(date).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-96">
        <span className="text-lg text-gray-500">Loading projects...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-8 flex items-center justify-center h-96">
        <span className="text-lg text-red-500">{error}</span>
      </div>
    );
  }
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-gray-600 mt-1">
            Manage your projects and CI/CD pipelines
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <GitBranch className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Pipelines</p>
                <p className="text-2xl font-bold">
                  {projects.reduce((sum, p) => sum + (p.pipelinesCount || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Settings className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tests</p>
                <p className="text-2xl font-bold">
                  {projects.reduce((sum, p) => sum + (p.testsCount || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🧪</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Deployments</p>
                <p className="text-2xl font-bold">
                  {projects.reduce((sum, p) => sum + (p.deploymentsCount || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filterTech}
            onChange={(e) => setFilterTech(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">All Technologies</option>
            <option value="nodejs">Node.js</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="go">Go</option>
            <option value="dotnet">.NET</option>
            <option value="ruby">Ruby</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-4">📁</div>
            <p className="text-gray-600 mb-2">No projects found</p>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm || filterTech !== "all"
                ? "Try adjusting your search or filters"
                : "Create your first project to get started"}
            </p>
            {!searchTerm && filterTech === "all" && (
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{techIcons[project.technology] || "📦"}</span>
                      <CardTitle className="text-xl">{project.name}</CardTitle>
                    </div>
                    <CardDescription className="mt-2 line-clamp-2">
                      {project.description}
                    </CardDescription>
                  </div>
                  <Badge variant={project.visibility === "private" ? "secondary" : "default"}>
                    {project.visibility === "private" ? "🔒 Private" : "🌐 Public"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Repository Info */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <GitBranch className="w-4 h-4" />
                  <span className="font-mono text-xs">{project.branch}</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 py-3 border-y border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{project.pipelinesCount}</p>
                    <p className="text-xs text-gray-600">Pipelines</p>
                  </div>
                  <div className="text-center border-x border-gray-100">
                    <p className="text-lg font-bold text-gray-900">{project.testsCount}</p>
                    <p className="text-xs text-gray-600">Tests</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{project.deploymentsCount}</p>
                    <p className="text-xs text-gray-600">Deployments</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-gray-600">
                    {project.team && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{project.team}</span>
                      </div>
                    )}
                    {project.lastActivity && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatTimeAgo(project.lastActivity)}</span>
                      </div>
                    )}
                  </div>

                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreateProject}
      />
    </div>
  )
}

"use client";

import { useEffect, useState } from "react";
import { Building2, Users, Folder, Plus, Trash2, X, UserPlus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/layout/auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { api, friendlyError } from "@/lib/api";

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  workspace_type: string;
  owner_id: string;
  role: string;
}

interface Member {
  user_id: string;
  email: string;
  name: string | null;
  role: string;
  joined_at: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  workspace_id: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Эзэн",
  admin: "Админ",
  editor: "Засварлагч",
  viewer: "Үзэгч",
};

const COLORS = ["#5965D8", "#27845B", "#C58B25", "#D64D4D", "#8B5CF6", "#EC4899"];

export default function WorkspacesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectColor, setProjectColor] = useState("#5965D8");

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      loadMembers(selectedWorkspace);
      loadProjects(selectedWorkspace);
    }
  }, [selectedWorkspace]);

  const loadWorkspaces = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listWorkspaces();
      setWorkspaces(data);
      if (data.length > 0 && !selectedWorkspace) {
        setSelectedWorkspace(data[0].id);
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async (workspaceId: string) => {
    try {
      const data = await api.listWorkspaceMembers(workspaceId);
      setMembers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProjects = async (workspaceId: string) => {
    try {
      const data = await api.listProjects(workspaceId);
      setProjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const ws = await api.createWorkspace({ name: newName.trim(), description: newDescription.trim() || undefined });
      setWorkspaces([...workspaces, ws]);
      setSelectedWorkspace(ws.id);
      setShowCreate(false);
      setNewName("");
      setNewDescription("");
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const handleInvite = async () => {
    if (!selectedWorkspace || !inviteEmail.trim()) return;
    try {
      await api.inviteWorkspaceMember(selectedWorkspace, inviteEmail.trim(), inviteRole);
      loadMembers(selectedWorkspace);
      setShowInvite(false);
      setInviteEmail("");
      setInviteRole("viewer");
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedWorkspace || !confirm("Энэ гишүүнийг хасах уу?")) return;
    try {
      await api.removeWorkspaceMember(selectedWorkspace, userId);
      loadMembers(selectedWorkspace);
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const handleCreateProject = async () => {
    if (!selectedWorkspace || !projectName.trim()) return;
    try {
      const project = await api.createProject(selectedWorkspace, { name: projectName.trim(), color: projectColor });
      setProjects([...projects, project]);
      setShowCreateProject(false);
      setProjectName("");
      setProjectColor("#5965D8");
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!selectedWorkspace || !confirm("Энэ project-г устгах уу?")) return;
    try {
      await api.deleteProject(selectedWorkspace, projectId);
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const currentWorkspace = workspaces.find((w) => w.id === selectedWorkspace);
  const canManage = currentWorkspace && (currentWorkspace.role === "owner" || currentWorkspace.role === "admin");

  return (
    <AuthGuard>
      <AppShell>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Workspace-ууд</h1>
              <p className="mt-2 text-base text-muted-foreground">
                Багийн хамтын ажиллагааны орон зай
              </p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="gap-2 rounded-full bg-foreground text-background shadow-lg shadow-foreground/10 hover:opacity-90 h-11 px-6">
              <Plus className="h-4 w-4" />
              Шинэ workspace
            </Button>
          </div>

          {/* Create dialog */}
          {showCreate && (
            <Card className="mb-8 rounded-2xl border-border/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display text-xl">Шинэ workspace үүсгэх</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)} className="rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Нэр</label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Жишээ: Marketing Team"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Тайлбар</label>
                  <Input
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Товч тайлбар"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreate} disabled={!newName.trim()}>
                    Үүсгэх
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreate(false)}>
                    Цуцлах
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} />
          ) : workspaces.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Workspace алга"
              description="Эхний workspace-ээ үүсгэнэ үү"
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              {/* Workspace list */}
              <div className="space-y-2">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => setSelectedWorkspace(ws.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      selectedWorkspace === ws.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      {ws.workspace_type === "personal" ? (
                        <Users className="h-5 w-5" />
                      ) : (
                        <Building2 className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{ws.name}</p>
                      <p className="text-xs text-muted-foreground">{ROLE_LABELS[ws.role]}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Workspace details */}
              {currentWorkspace && (
                <div className="space-y-6">
                  {/* Header */}
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-xl font-bold">{currentWorkspace.name}</h2>
                          {currentWorkspace.description && (
                            <p className="mt-1 text-sm text-muted-foreground">{currentWorkspace.description}</p>
                          )}
                          <p className="mt-2 text-xs text-muted-foreground">
                            {currentWorkspace.workspace_type === "personal" ? "Хувийн" : "Багийн"} workspace
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Members */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Гишүүд ({members.length})
                      </CardTitle>
                      {canManage && (
                        <Button size="sm" onClick={() => setShowInvite(true)} className="gap-1">
                          <UserPlus className="h-4 w-4" />
                          Урих
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent>
                      {showInvite && (
                        <div className="mb-4 flex gap-2">
                          <Input
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="email@example.com"
                            className="flex-1"
                          />
                          <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="viewer">Үзэгч</option>
                            <option value="editor">Засварлагч</option>
                            <option value="admin">Админ</option>
                          </select>
                          <Button onClick={handleInvite} disabled={!inviteEmail.trim()}>
                            Илгээх
                          </Button>
                          <Button variant="outline" onClick={() => setShowInvite(false)}>
                            Цуцлах
                          </Button>
                        </div>
                      )}
                      <div className="space-y-2">
                        {members.map((member) => (
                          <div key={member.user_id} className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                              <p className="font-medium">{member.name || member.email}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{ROLE_LABELS[member.role]}</span>
                              {canManage && member.role !== "owner" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleRemoveMember(member.user_id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Projects */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Folder className="h-5 w-5" />
                        Project-ууд ({projects.length})
                      </CardTitle>
                      {canManage && (
                        <Button size="sm" onClick={() => setShowCreateProject(true)} className="gap-1">
                          <Plus className="h-4 w-4" />
                          Нэмэх
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent>
                      {showCreateProject && (
                        <div className="mb-4 space-y-3 rounded-lg border p-4">
                          <Input
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Project нэр"
                          />
                          <div className="flex gap-2">
                            {COLORS.map((color) => (
                              <button
                                key={color}
                                onClick={() => setProjectColor(color)}
                                className={`h-8 w-8 rounded-full border-2 ${
                                  projectColor === color ? "border-foreground" : "border-transparent"
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleCreateProject} disabled={!projectName.trim()}>
                              Үүсгэх
                            </Button>
                            <Button variant="outline" onClick={() => setShowCreateProject(false)}>
                              Цуцлах
                            </Button>
                          </div>
                        </div>
                      )}
                      {projects.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-4">
                          Project алга
                        </p>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {projects.map((project) => (
                            <div key={project.id} className="flex items-center justify-between rounded-lg border p-3">
                              <div className="flex items-center gap-3">
                                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: project.color }} />
                                <div>
                                  <p className="font-medium">{project.name}</p>
                                  {project.description && (
                                    <p className="text-xs text-muted-foreground">{project.description}</p>
                                  )}
                                </div>
                              </div>
                              {canManage && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteProject(project.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </main>
      </AppShell>
    </AuthGuard>
  );
}

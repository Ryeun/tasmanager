import React, {useState, useEffect} from 'react';

const API = 'http://localhost:5000/api';

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [auth, setAuth] = useState({ name: '', email: '', password: '', role: 'user' });
  const [form, setForm] = useState({ title: '', priority: 'medium', status: 'pending' });

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchTasks = async () => {
    if (!token) return;
    const query = new URLSearchParams({ ...(search && { search }), ...(statusFilter && { status: statusFilter }) });
    const res = await fetch(`${API}/tasks?${query}`, { headers });
    const data = await res.json();
    if (Array.isArray(data)) {
      setTasks(data);
    }
  };

  useEffect(() => { fetchTasks(); }, [token, search, statusFilter]);

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    const res = await fetch(`${API}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(auth) });
    const data = await res.json();
    if (!res.ok) return alert(data.message || 'Auth failed');
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const res = await fetch(`${API}/tasks`, { method: 'POST', headers, body: JSON.stringify(form) });
    const data = await res.json();
    setTasks([data, ...tasks]);
    setForm({ title: '', priority: 'medium', status: 'pending' });
  };

  const handleStatus = async (task, status) => {
    const res = await fetch(`${API}/tasks/${task._id}`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
    const updated = await res.json();
    setTasks(tasks.map((t) => (t._id === task._id ? updated : t)));
  };

  const handleDelete = async (id) => {
    await fetch(`${API}/tasks/${id}`, { method: 'DELETE', headers });
    setTasks(tasks.filter((t) => t._id !== id));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <form onSubmit={handleAuth} className="w-full max-w-sm bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-xl font-bold text-emerald-400">{isRegister ? 'Register Account' : 'Welcome Back'}</h2>
          {isRegister && (
            <>
              <input className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-500" placeholder="Full Name" required onChange={(e) => setAuth({ ...auth, name: e.target.value })} />
              <select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm" value={auth.role} onChange={(e) => setAuth({ ...auth, role: e.target.value })}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </>
          )}
          <input className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-500" type="email" placeholder="Email" required onChange={(e) => setAuth({ ...auth, email: e.target.value })} />
          <input className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-500" type="password" placeholder="Password" required onChange={(e) => setAuth({ ...auth, password: e.target.value })} />
          <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-lg text-sm transition">{isRegister ? 'Sign Up' : 'Log In'}</button>
          <p onClick={() => setIsRegister(!isRegister)} className="text-center text-xs text-slate-400 cursor-pointer hover:underline">{isRegister ? 'Have an account? Log In' : 'Need an account? Register'}</p>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        <header className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              ⚡ QuickTask <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase font-mono">{user.role}</span>
            </h1>
            <span className="text-xs text-slate-400">{user.email}</span>
          </div>
          <button onClick={() => { localStorage.clear(); setUser(null); setToken(''); }} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg transition">Logout</button>
        </header>

        <form onSubmit={handleCreateTask} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <input className="sm:col-span-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" placeholder="What needs to be done?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-lg text-sm py-2 transition">+ Add Task</button>
        </form>

        <div className="flex gap-2">
          <input className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tasks.map((task) => (
            <div key={task._id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-3">
              <div className="truncate">
                <p className={`text-sm font-semibold truncate ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-100'}`}>{task.title}</p>
                <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${task.priority === 'high' ? 'bg-rose-950 text-rose-400' : task.priority === 'low' ? 'bg-sky-950 text-sky-400' : 'bg-amber-950 text-amber-400'}`}>{task.priority}</span>
              </div>
              <div className="flex items-center gap-2">
                <select value={task.status} onChange={(e) => handleStatus(task, e.target.value)} className="bg-slate-800 border border-slate-700 text-xs rounded px-2 py-1 outline-none">
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <button onClick={() => handleDelete(task._id)} className="text-xs text-rose-400 hover:text-rose-300 font-bold px-1">✕</button>
              </div>
            </div>
          ))}
        </div>
        {tasks.length === 0 && <p className="text-center text-xs text-slate-500 py-8">No tasks found.</p>}
      </div>
    </div>
  );
}
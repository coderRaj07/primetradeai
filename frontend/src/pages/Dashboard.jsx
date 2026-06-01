import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tasksAPI } from '../services/api';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [fetchError, setFetchError] = useState('');
  const [fetching, setFetching] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      setFetchError('');
      const res = await tasksAPI.getAll();
      setTasks(res.data.tasks);
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }
    if (user) fetchTasks();
  }, [user, loading, navigate, fetchTasks]);

  const handleCreated = (task) => {
    setTasks((prev) => [task, ...prev]);
  };

  const handleUpdated = (task) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
  };

  const handleDeleted = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return null;

  return (
    <div className="dashboard">
      <h2>Welcome, {user.name}</h2>
      <p className="dashboard-subtitle">
        Role: <strong>{user.role}</strong> | Email: {user.email}
      </p>

      <TaskForm onCreated={handleCreated} />

      <hr />

      <h3>Your Tasks ({tasks.length})</h3>
      {fetching ? (
        <p className="loading">Loading tasks...</p>
      ) : fetchError ? (
        <div className="alert alert-error">{fetchError}</div>
      ) : (
        <TaskList tasks={tasks} onUpdated={handleUpdated} onDeleted={handleDeleted} />
      )}
    </div>
  );
}

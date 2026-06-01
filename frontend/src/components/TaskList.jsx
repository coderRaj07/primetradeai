import { useState } from 'react';
import { tasksAPI } from '../services/api';

export default function TaskList({ tasks, onUpdated, onDeleted }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [error, setError] = useState('');

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditData({ title: task.title, description: task.description, status: task.status });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleUpdate = async (id) => {
    setError('');
    try {
      const res = await tasksAPI.update(id, editData);
      setEditingId(null);
      onUpdated(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    setError('');
    try {
      await tasksAPI.delete(id);
      onDeleted(id);
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  if (tasks.length === 0) {
    return <p className="empty-state">No tasks yet. Create one above!</p>;
  }

  return (
    <div className="task-list">
      {error && <div className="alert alert-error">{error}</div>}
      {tasks.map((task) => (
        <div key={task.id} className={`task-card task-${task.status}`}>
          {editingId === task.id ? (
            <div className="task-edit-form">
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="form-control"
              />
              <textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="form-control"
                rows={2}
              />
              <select
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                className="form-control"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <div className="btn-group">
                <button onClick={() => handleUpdate(task.id)} className="btn btn-primary btn-sm">
                  Save
                </button>
                <button onClick={cancelEdit} className="btn btn-outline btn-sm">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="task-header">
                <h4>{task.title}</h4>
                <span className={`badge badge-${task.status}`}>{task.status}</span>
              </div>
              {task.description && <p className="task-desc">{task.description}</p>}
              <div className="task-meta">
                <small>Created: {new Date(task.created_at).toLocaleDateString()}</small>
              </div>
              <div className="btn-group">
                <button onClick={() => startEdit(task)} className="btn btn-outline btn-sm">
                  Edit
                </button>
                <button onClick={() => handleDelete(task.id)} className="btn btn-danger btn-sm">
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

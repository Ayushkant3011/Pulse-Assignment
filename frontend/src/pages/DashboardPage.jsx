import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineFilm,
  HiOutlineShieldCheck,
  HiOutlineExclamation,
  HiOutlineClock,
  HiOutlineSearch,
  HiOutlinePlay,
  HiOutlineCloudUpload,
} from 'react-icons/hi';

export default function DashboardPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState({ total: 0, safe: 0, flagged: 0, processing: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sensitivityFilter, setSensitivityFilter] = useState('');

  const fetchVideos = useCallback(async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (sensitivityFilter) params.sensitivityStatus = sensitivityFilter;

      const res = await api.get('/videos', { params });
      setVideos(res.data.videos);

      // Calculate stats from all videos (unfiltered)
      const allRes = await api.get('/videos', { params: { limit: 1000 } });
      const all = allRes.data.videos;
      setStats({
        total: all.length,
        safe: all.filter((v) => v.sensitivityStatus === 'safe').length,
        flagged: all.filter((v) => v.sensitivityStatus === 'flagged').length,
        processing: all.filter((v) => v.status === 'processing' || v.status === 'uploading').length,
      });
    } catch (err) {
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sensitivityFilter]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Real-time socket updates
  useEffect(() => {
    if (!socket) return;

    const handleProgress = (data) => {
      setVideos((prev) =>
        prev.map((v) =>
          v._id === data.videoId
            ? { ...v, processingProgress: data.progress, status: 'processing' }
            : v
        )
      );
    };

    const handleComplete = (data) => {
      setVideos((prev) =>
        prev.map((v) =>
          v._id === data.videoId
            ? {
                ...v,
                status: 'completed',
                processingProgress: 100,
                sensitivityStatus: data.status,
                sensitivityDetails: data.sensitivityDetails,
              }
            : v
        )
      );
      toast.success(`Video processed: ${data.status === 'safe' ? '✅ Safe' : '⚠️ Flagged'}`);
      fetchVideos(); // Refresh stats
    };

    const handleFailed = (data) => {
      setVideos((prev) =>
        prev.map((v) =>
          v._id === data.videoId ? { ...v, status: 'failed' } : v
        )
      );
      toast.error('Video processing failed');
    };

    socket.on('video:processing_progress', handleProgress);
    socket.on('video:processing_complete', handleComplete);
    socket.on('video:processing_failed', handleFailed);

    return () => {
      socket.off('video:processing_progress', handleProgress);
      socket.off('video:processing_complete', handleComplete);
      socket.off('video:processing_failed', handleFailed);
    };
  }, [socket, fetchVideos]);

  const formatSize = (bytes) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case 'safe': return 'badge badge-safe';
      case 'flagged': return 'badge badge-flagged';
      case 'processing': return 'badge badge-processing';
      default: return 'badge badge-pending';
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.username}</p>
        </div>
        {(user?.role === 'editor' || user?.role === 'admin') && (
          <button
            className="btn btn-primary"
            onClick={() => navigate('/upload')}
            id="upload-btn"
          >
            <HiOutlineCloudUpload />
            Upload Video
          </button>
        )}
      </div>

      {/* Stats cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(137, 180, 250, 0.15)', color: 'var(--accent-blue)' }}>
            <HiOutlineFilm />
          </div>
          <div className="stat-card-value">{stats.total}</div>
          <div className="stat-card-label">Total Videos</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(166, 227, 161, 0.15)', color: 'var(--accent-green)' }}>
            <HiOutlineShieldCheck />
          </div>
          <div className="stat-card-value">{stats.safe}</div>
          <div className="stat-card-label">Safe</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(243, 139, 168, 0.15)', color: 'var(--accent-red)' }}>
            <HiOutlineExclamation />
          </div>
          <div className="stat-card-value">{stats.flagged}</div>
          <div className="stat-card-label">Flagged</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(249, 226, 175, 0.15)', color: 'var(--accent-yellow)' }}>
            <HiOutlineClock />
          </div>
          <div className="stat-card-value">{stats.processing}</div>
          <div className="stat-card-label">Processing</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input">
          <HiOutlineSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search videos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="search-videos"
          />
        </div>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          id="filter-status"
        >
          <option value="">All Status</option>
          <option value="uploading">Uploading</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <select
          className="filter-select"
          value={sensitivityFilter}
          onChange={(e) => setSensitivityFilter(e.target.value)}
          id="filter-sensitivity"
        >
          <option value="">All Safety</option>
          <option value="safe">Safe</option>
          <option value="flagged">Flagged</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Video grid */}
      {videos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><HiOutlineFilm /></div>
          <p className="empty-state-text">No videos found</p>
          <p className="empty-state-hint">
            {search || statusFilter || sensitivityFilter
              ? 'Try adjusting your filters'
              : 'Upload your first video to get started'}
          </p>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((video) => (
            <div
              key={video._id}
              className="video-card"
              onClick={() => video.status === 'completed' && navigate(`/videos/${video._id}`)}
              style={{ cursor: video.status === 'completed' ? 'pointer' : 'default' }}
              id={`video-card-${video._id}`}
            >
              <div className="video-card-thumbnail">
                <HiOutlinePlay className="play-icon" />
              </div>
              <div className="video-card-body">
                <h3 className="video-card-title">{video.title}</h3>
                <div className="video-card-meta">
                  <span className={getBadgeClass(
                    video.status === 'completed' ? video.sensitivityStatus : video.status
                  )}>
                    {video.status === 'completed' ? video.sensitivityStatus : video.status}
                  </span>
                  <span className="video-card-size">{formatSize(video.size)}</span>
                  <span className="video-card-date">{formatDate(video.createdAt)}</span>
                </div>
              </div>
              {(video.status === 'processing' || video.status === 'uploading') && (
                <div className="video-card-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${video.processingProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

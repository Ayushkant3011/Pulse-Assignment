import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineTrash,
  HiOutlineShieldCheck,
  HiOutlineExclamation,
  HiOutlineClock,
  HiOutlineTag,
} from 'react-icons/hi';

export default function VideoPlayerPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await api.get(`/videos/${id}`);
        setVideo(res.data.video);
      } catch {
        toast.error('Video not found');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    try {
      await api.delete(`/videos/${id}`);
      toast.success('Video deleted');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const formatSize = (bytes) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  if (!video) return null;

  // Build the streaming URL with auth token as query param
  // (HTML5 <video> tags cannot send Authorization headers)
  const streamUrl = `${import.meta.env.VITE_API_URL || '/api'}/videos/${video._id}/stream?token=${token}`;

  const canDelete = user?.role === 'admin' ||
    (user?.role === 'editor' && video.uploadedBy?._id === user?._id);

  return (
    <div className="player-page">
      {/* Header */}
      <div className="page-header">
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')} id="back-btn">
          <HiOutlineArrowLeft /> Back
        </button>
        {canDelete && (
          <button className="btn btn-danger btn-sm" onClick={handleDelete} id="delete-video-btn">
            <HiOutlineTrash /> Delete
          </button>
        )}
      </div>

      {/* Video player */}
      <div className="player-wrapper">
        <video
          controls
          preload="metadata"
          id="video-player"
        >
          <source
            src={streamUrl}
            type={video.mimetype}
          />
          Your browser does not support video playback.
        </video>
      </div>

      {/* Video details */}
      <div className="video-details">
        <h1 className="video-title">{video.title}</h1>

        <div className="video-meta-row">
          <span className={`badge ${video.sensitivityStatus === 'safe' ? 'badge-safe' : video.sensitivityStatus === 'flagged' ? 'badge-flagged' : 'badge-pending'}`}>
            {video.sensitivityStatus === 'safe' && <HiOutlineShieldCheck />}
            {video.sensitivityStatus === 'flagged' && <HiOutlineExclamation />}
            {video.sensitivityStatus === 'pending' && <HiOutlineClock />}
            {video.sensitivityStatus}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {formatSize(video.size)}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Uploaded by {video.uploadedBy?.username || 'Unknown'}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {formatDate(video.createdAt)}
          </span>
        </div>

        {video.description && (
          <div className="video-description">{video.description}</div>
        )}

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="video-meta-row">
            <HiOutlineTag style={{ color: 'var(--text-muted)' }} />
            {video.tags.map((tag, i) => (
              <span key={i} className="badge badge-pending">{tag}</span>
            ))}
          </div>
        )}

        {/* Sensitivity details */}
        {video.sensitivityDetails && video.sensitivityStatus !== 'pending' && (
          <div className="video-sensitivity-details">
            <div className="sensitivity-header">
              <strong>Sensitivity Analysis</strong>
              <span className="sensitivity-score">
                Score: {video.sensitivityDetails.score}
              </span>
            </div>
            {video.sensitivityDetails.categories?.length > 0 && (
              <div className="sensitivity-categories">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: 8 }}>
                  Categories:
                </span>
                {video.sensitivityDetails.categories.map((cat, i) => (
                  <span key={i} className="badge badge-flagged">
                    {cat.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
            {video.sensitivityDetails.analyzedAt && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 12 }}>
                Analyzed on {formatDate(video.sensitivityDetails.analyzedAt)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

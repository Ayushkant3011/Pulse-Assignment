import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineCloudUpload,
  HiOutlineFilm,
  HiOutlineX,
} from 'react-icons/hi';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    const allowed = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'];
    if (!allowed.includes(selectedFile.type)) {
      toast.error('Invalid file type. Please upload a video file.');
      return;
    }

    if (selectedFile.size > 100 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 100MB.');
      return;
    }

    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a video file');
      return;
    }
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    if (tags.trim()) formData.append('tags', tags.trim());

    setUploading(true);
    setUploadProgress(0);

    try {
      await api.post('/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percent);
        },
      });

      toast.success('Video uploaded! Processing has started.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const removeFile = () => {
    setFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Upload Video</h1>
          <p className="page-subtitle">Upload a video for sensitivity analysis</p>
        </div>
      </div>

      <div className="upload-area">
        {!file ? (
          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            id="drop-zone"
          >
            <div className="drop-zone-icon"><HiOutlineCloudUpload /></div>
            <p className="drop-zone-text">
              Drag & drop your video here, or <strong>click to browse</strong>
            </p>
            <p className="drop-zone-hint">
              MP4, WebM, AVI, MOV, MKV — Max 100MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e.target.files[0])}
              id="file-input"
            />
          </div>
        ) : (
          <form className="upload-form" onSubmit={handleSubmit} id="upload-form">
            {/* Selected file info */}
            <div className="upload-file-info">
              <HiOutlineFilm className="upload-file-icon" />
              <div className="upload-file-details">
                <div className="upload-file-name">{file.name}</div>
                <div className="upload-file-size">{formatSize(file.size)}</div>
              </div>
              {!uploading && (
                <button type="button" className="upload-remove-btn" onClick={removeFile}>
                  <HiOutlineX />
                </button>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="upload-title">Title *</label>
              <input
                id="upload-title"
                className="form-input"
                type="text"
                placeholder="Enter video title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={uploading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="upload-description">Description</label>
              <textarea
                id="upload-description"
                className="form-textarea"
                placeholder="Enter video description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={uploading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="upload-tags">Tags</label>
              <input
                id="upload-tags"
                className="form-input"
                type="text"
                placeholder="Comma-separated tags (e.g. tutorial, demo)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={uploading}
              />
            </div>

            {uploading && (
              <div className="upload-progress">
                <div className="upload-progress-text">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading}
              id="upload-submit"
            >
              <HiOutlineCloudUpload />
              {uploading ? 'Uploading...' : 'Upload & Process'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

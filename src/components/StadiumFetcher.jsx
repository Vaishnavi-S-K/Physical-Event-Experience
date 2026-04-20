import React, { useState } from 'react';
import axios from 'axios';
import './StadiumFetcher.css';

export default function StadiumFetcher() {
  const [name, setName] = useState('');
  const [stadium, setStadium] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStadium = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/stadiums/fetch', { name });
      setStadium(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="stadium-fetcher">
      <h2 className="section-title">Add / Update Stadium (Google)</h2>
      <div className="input-group">
        <input
          type="text"
          placeholder="Enter stadium name (e.g. ‘Wankhede Stadium’)"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <button onClick={fetchStadium} disabled={loading}>
          {loading ? 'Fetching…' : 'Fetch from Google'}
        </button>
      </div>
      {error && <p className="error-msg">{error}</p>}
      {stadium && (
        <article className="stadium-card">
          <h3>{stadium.name}</h3>
          <p><strong>Address:</strong> {stadium.address}</p>
          <p><strong>Location:</strong> {stadium.location?.lat?.toFixed(5)}, {stadium.location?.lng?.toFixed(5)}</p>
          <p><strong>Estimated Gates:</strong> {stadium.gatesCount ?? 'N/A'}</p>
          {stadium.foodCourts?.length > 0 && (
            <>
              <h4>Nearby Food Courts</h4>
              <ul>
                {stadium.foodCourts.map((fc, i) => (
                  <li key={i}>
                    {fc.name} – {fc.distanceMeters ? `${fc.distanceMeters} m` : 'unknown distance'}
                  </li>
                ))}
              </ul>
            </>
          )}
        </article>
      )}
    </section>
  );
}

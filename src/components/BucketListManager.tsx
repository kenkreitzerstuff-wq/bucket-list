import React, { useState } from 'react';
import { BucketItem, CostEstimate } from '../types';
import './BucketListManager.css';

interface BucketListManagerProps {
  bucketList: BucketItem[];
  onAdd: (item: BucketItem) => void;
  onRemove: (itemId: string) => void;
  onUpdate: (itemId: string, updates: Partial<BucketItem>) => void;
  costEstimates?: { [itemId: string]: CostEstimate };
  className?: string;
}

interface BucketItemCardProps {
  item: BucketItem;
  costEstimate?: CostEstimate;
  onRemove: (itemId: string) => void;
  onUpdate: (itemId: string, updates: Partial<BucketItem>) => void;
}

const BucketItemCard: React.FC<BucketItemCardProps> = ({
  item,
  costEstimate,
  onRemove,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editedItem, setEditedItem] = useState<Partial<BucketItem>>({
    destination: item.destination,
    experiences: [...item.experiences],
    priority: item.priority,
    notes: item.notes || ''
  });

  const handleSaveEdit = () => {
    onUpdate(item.id, editedItem);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedItem({
      destination: item.destination,
      experiences: [...item.experiences],
      priority: item.priority,
      notes: item.notes || ''
    });
    setIsEditing(false);
  };

  const handleExperienceChange = (index: number, value: string) => {
    const newExperiences = [...(editedItem.experiences || [])];
    newExperiences[index] = value;
    setEditedItem({ ...editedItem, experiences: newExperiences });
  };

  const handleAddExperience = () => {
    const newExperiences = [...(editedItem.experiences || []), ''];
    setEditedItem({ ...editedItem, experiences: newExperiences });
  };

  const handleRemoveExperience = (index: number) => {
    const newExperiences = (editedItem.experiences || []).filter((_: string, i: number) => i !== index);
    setEditedItem({ ...editedItem, experiences: newExperiences });
  };

  const getPriorityColor = (priority: number): string => {
    if (priority <= 2) return 'high';
    if (priority <= 4) return 'medium';
    return 'low';
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'completed': return '✅';
      case 'booked': return '📅';
      case 'planned': return '📋';
      default: return '📋';
    }
  };

  const formatCostRange = (costRange: { min: number; max: number; currency: string }): string => {
    return `${costRange.currency} ${costRange.min.toLocaleString()} - ${costRange.max.toLocaleString()}`;
  };

  return (
    <div className={`bucket-item-card ${item.status}`}>
      <div className="bucket-item-header">
        <div className="item-status-priority">
          <span className="status-icon">{getStatusIcon(item.status)}</span>
          <span className={`priority-badge ${getPriorityColor(item.priority)}`}>
            Priority {item.priority}
          </span>
        </div>
        <div className="item-actions">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="expand-button"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="edit-button"
            aria-label="Edit item"
          >
            ✏️
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="remove-button"
            aria-label="Remove item"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="bucket-item-content">
        {isEditing ? (
          <div className="edit-form">
            <div className="form-group">
              <label htmlFor={`destination-${item.id}`}>Destination:</label>
              <input
                id={`destination-${item.id}`}
                type="text"
                value={editedItem.destination || ''}
                onChange={(e) => setEditedItem({ ...editedItem, destination: e.target.value })}
                className="destination-input"
              />
            </div>

            <div className="form-group">
              <label>Experiences:</label>
              <div className="experiences-list">
                {(editedItem.experiences || []).map((experience: string, index: number) => (
                  <div key={index} className="experience-input-group">
                    <input
                      type="text"
                      value={experience}
                      onChange={(e) => handleExperienceChange(index, e.target.value)}
                      className="experience-input"
                      placeholder="Enter experience"
                    />
                    <button
                      onClick={() => handleRemoveExperience(index)}
                      className="remove-experience-button"
                      aria-label="Remove experience"
                    >
                      ❌
                    </button>
                  </div>
                ))}
                <button onClick={handleAddExperience} className="add-experience-button">
                  + Add Experience
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor={`priority-${item.id}`}>Priority (1-5):</label>
              <select
                id={`priority-${item.id}`}
                value={editedItem.priority || 1}
                onChange={(e) => setEditedItem({ ...editedItem, priority: parseInt(e.target.value) })}
                className="priority-select"
              >
                <option value={1}>1 - Highest</option>
                <option value={2}>2 - High</option>
                <option value={3}>3 - Medium</option>
                <option value={4}>4 - Low</option>
                <option value={5}>5 - Lowest</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor={`notes-${item.id}`}>Notes:</label>
              <textarea
                id={`notes-${item.id}`}
                value={editedItem.notes || ''}
                onChange={(e) => setEditedItem({ ...editedItem, notes: e.target.value })}
                className="notes-textarea"
                rows={3}
                placeholder="Add any notes or special requirements"
              />
            </div>

            <div className="edit-actions">
              <button onClick={handleSaveEdit} className="save-button">
                Save Changes
              </button>
              <button onClick={handleCancelEdit} className="cancel-button">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="destination-title">{item.destination}</h3>
            
            <div className="item-details">
              <div className="duration-cost-info">
                <span className="duration-info">
                  ⏱️ {item.estimatedDuration} days
                </span>
                <span className="cost-info">
                  💰 {formatCostRange(item.costEstimate)}
                </span>
              </div>

              {costEstimate && (
                <div className="detailed-cost-breakdown">
                  <h4>Cost Breakdown:</h4>
                  <div className="cost-categories">
                    <div className="cost-category">
                      <span>Transportation:</span>
                      <span>{formatCostRange(costEstimate.transportation)}</span>
                    </div>
                    <div className="cost-category">
                      <span>Accommodation:</span>
                      <span>{formatCostRange(costEstimate.accommodation)}</span>
                    </div>
                    <div className="cost-category">
                      <span>Activities:</span>
                      <span>{formatCostRange(costEstimate.activities)}</span>
                    </div>
                    <div className="cost-category">
                      <span>Food:</span>
                      <span>{formatCostRange(costEstimate.food)}</span>
                    </div>
                    <div className="cost-category total">
                      <span>Total:</span>
                      <span>{formatCostRange(costEstimate.total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="experiences-section">
              <h4>Planned Experiences:</h4>
              <div className="experiences-grid">
                {item.experiences.map((experience: string, index: number) => (
                  <span key={index} className="experience-tag">
                    {experience}
                  </span>
                ))}
              </div>
            </div>

            {isExpanded && (
              <div className="expanded-details">
                {item.notes && (
                  <div className="notes-section">
                    <h4>Notes:</h4>
                    <p className="notes-text">{item.notes}</p>
                  </div>
                )}
                
                <div className="item-metadata">
                  <div className="metadata-item">
                    <strong>Status:</strong> {item.status}
                  </div>
                  <div className="metadata-item">
                    <strong>Priority:</strong> {item.priority}/5
                  </div>
                  <div className="metadata-item">
                    <strong>Duration:</strong> {item.estimatedDuration} days
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const BucketListManager: React.FC<BucketListManagerProps> = ({
  bucketList,
  onAdd,
  onRemove,
  onUpdate,
  costEstimates,
  className = ''
}) => {
  const [filter, setFilter] = useState<'all' | 'planned' | 'booked' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'duration' | 'cost' | 'destination'>('priority');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<Partial<BucketItem>>({
    destination: '',
    experiences: [''],
    priority: 3,
    estimatedDuration: 7,
    status: 'planned',
    notes: ''
  });

  const filteredItems = bucketList.filter(item => 
    filter === 'all' || item.status === filter
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        return a.priority - b.priority;
      case 'duration':
        return a.estimatedDuration - b.estimatedDuration;
      case 'cost':
        return a.costEstimate.min - b.costEstimate.min;
      case 'destination':
        return a.destination.localeCompare(b.destination);
      default:
        return 0;
    }
  });

  const handleAddItem = () => {
    if (!newItem.destination || !newItem.experiences?.length) {
      return;
    }

    const bucketItem: BucketItem = {
      id: `custom-${Date.now()}`,
      destination: newItem.destination,
      experiences: newItem.experiences.filter((exp: string) => exp.trim() !== ''),
      estimatedDuration: newItem.estimatedDuration || 7,
      costEstimate: {
        min: 1000,
        max: 3000,
        currency: 'USD'
      },
      priority: newItem.priority || 3,
      status: newItem.status as 'planned' | 'booked' | 'completed' || 'planned',
      notes: newItem.notes
    };

    onAdd(bucketItem);
    setNewItem({
      destination: '',
      experiences: [''],
      priority: 3,
      estimatedDuration: 7,
      status: 'planned',
      notes: ''
    });
    setShowAddForm(false);
  };

  const handleNewItemExperienceChange = (index: number, value: string) => {
    const newExperiences = [...(newItem.experiences || [])];
    newExperiences[index] = value;
    setNewItem({ ...newItem, experiences: newExperiences });
  };

  const handleAddNewExperience = () => {
    const newExperiences = [...(newItem.experiences || []), ''];
    setNewItem({ ...newItem, experiences: newExperiences });
  };

  const handleRemoveNewExperience = (index: number) => {
    const newExperiences = (newItem.experiences || []).filter((_: string, i: number) => i !== index);
    setNewItem({ ...newItem, experiences: newExperiences });
  };

  const getTotalCost = (): { min: number; max: number } => {
    return bucketList.reduce(
      (total, item) => ({
        min: total.min + item.costEstimate.min,
        max: total.max + item.costEstimate.max
      }),
      { min: 0, max: 0 }
    );
  };

  const getTotalDuration = (): number => {
    return bucketList.reduce((total, item) => total + item.estimatedDuration, 0);
  };

  const totalCost = getTotalCost();
  const totalDuration = getTotalDuration();

  return (
    <div className={`bucket-list-manager ${className}`}>
      <div className="bucket-list-header">
        <h2>Your Travel Bucket List</h2>
        <p className="bucket-list-subtitle">
          Organize and manage your dream destinations and experiences
        </p>

        <div className="bucket-list-stats">
          <div className="stat-card">
            <span className="stat-number">{bucketList.length}</span>
            <span className="stat-label">Total Items</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{totalDuration}</span>
            <span className="stat-label">Total Days</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              ${totalCost.min.toLocaleString()} - ${totalCost.max.toLocaleString()}
            </span>
            <span className="stat-label">Estimated Cost</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {bucketList.filter(item => item.status === 'completed').length}
            </span>
            <span className="stat-label">Completed</span>
          </div>
        </div>

        <div className="bucket-list-controls">
          <div className="filter-sort-controls">
            <div className="filter-controls">
              <label htmlFor="status-filter">Filter by status:</label>
              <select
                id="status-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'planned' | 'booked' | 'completed')}
                className="filter-select"
              >
                <option value="all">All Items</option>
                <option value="planned">Planned</option>
                <option value="booked">Booked</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="sort-controls">
              <label htmlFor="sort-select">Sort by:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'priority' | 'duration' | 'cost' | 'destination')}
                className="sort-select"
              >
                <option value="priority">Priority</option>
                <option value="duration">Duration</option>
                <option value="cost">Cost</option>
                <option value="destination">Destination</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="add-item-button"
          >
            {showAddForm ? '❌ Cancel' : '➕ Add New Item'}
          </button>
        </div>

        {showAddForm && (
          <div className="add-item-form">
            <h3>Add New Bucket List Item</h3>
            
            <div className="form-group">
              <label htmlFor="new-destination">Destination:</label>
              <input
                id="new-destination"
                type="text"
                value={newItem.destination || ''}
                onChange={(e) => setNewItem({ ...newItem, destination: e.target.value })}
                className="destination-input"
                placeholder="Enter destination name"
              />
            </div>

            <div className="form-group">
              <label>Experiences:</label>
              <div className="experiences-list">
                {(newItem.experiences || []).map((experience: string, index: number) => (
                  <div key={index} className="experience-input-group">
                    <input
                      type="text"
                      value={experience}
                      onChange={(e) => handleNewItemExperienceChange(index, e.target.value)}
                      className="experience-input"
                      placeholder="Enter experience"
                    />
                    <button
                      onClick={() => handleRemoveNewExperience(index)}
                      className="remove-experience-button"
                      aria-label="Remove experience"
                    >
                      ❌
                    </button>
                  </div>
                ))}
                <button onClick={handleAddNewExperience} className="add-experience-button">
                  + Add Experience
                </button>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="new-priority">Priority:</label>
                <select
                  id="new-priority"
                  value={newItem.priority || 3}
                  onChange={(e) => setNewItem({ ...newItem, priority: parseInt(e.target.value) })}
                  className="priority-select"
                >
                  <option value={1}>1 - Highest</option>
                  <option value={2}>2 - High</option>
                  <option value={3}>3 - Medium</option>
                  <option value={4}>4 - Low</option>
                  <option value={5}>5 - Lowest</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="new-duration">Duration (days):</label>
                <input
                  id="new-duration"
                  type="number"
                  min="1"
                  max="365"
                  value={newItem.estimatedDuration || 7}
                  onChange={(e) => setNewItem({ ...newItem, estimatedDuration: parseInt(e.target.value) })}
                  className="duration-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="new-notes">Notes:</label>
              <textarea
                id="new-notes"
                value={newItem.notes || ''}
                onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                className="notes-textarea"
                rows={3}
                placeholder="Add any notes or special requirements"
              />
            </div>

            <div className="add-form-actions">
              <button onClick={handleAddItem} className="save-new-item-button">
                Add to Bucket List
              </button>
              <button onClick={() => setShowAddForm(false)} className="cancel-new-item-button">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bucket-list-content">
        {sortedItems.length === 0 ? (
          <div className="empty-bucket-list">
            <h3>Your bucket list is empty</h3>
            <p>Add your first destination to start planning your dream trips!</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="add-first-item-button"
            >
              ➕ Add Your First Destination
            </button>
          </div>
        ) : (
          <div className="bucket-items-grid">
            {sortedItems.map((item) => (
              <BucketItemCard
                key={item.id}
                item={item}
                costEstimate={costEstimates?.[item.id]}
                onRemove={onRemove}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        )}

        {filteredItems.length === 0 && filter !== 'all' && bucketList.length > 0 && (
          <div className="no-filtered-results">
            <p>No {filter} items found. Try changing the filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BucketListManager;
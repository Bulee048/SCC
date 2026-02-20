const EmptyState = ({ 
  icon = '📭',
  title = 'No items found',
  description = 'Get started by creating your first item',
  action,
  actionText = 'Create New'
}) => {
  return (
    <div className="empty-state fade-in">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && (
        <button onClick={action} className="btn btn-primary">
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

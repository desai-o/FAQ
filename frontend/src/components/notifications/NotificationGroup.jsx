function NotificationGroup({ label, children }) {
  if (!children || (Array.isArray(children) && children.length === 0)) {
    return null;
  }
  return (
    <div className="notif-group">
      <div className="notif-group-header">
        <span className="notif-group-label">{label}</span>
      </div>
      <div className="notif-group-items">
        {children}
      </div>
    </div>
  );
}

export default NotificationGroup;

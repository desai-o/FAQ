import { useState } from "react";
import { followResource, unfollowResource } from "../api/faqApi";

export default function Hashtag({ tag }) {
  const [isHovered, setIsHovered] = useState(false);
  const [followData, setFollowData] = useState({ isFollowing: false, followId: null });

  const toggleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!followData.isFollowing) {
      try {
        const res = await followResource("tag", tag);
        const followId = res.data?._id || res.data?.id || followData.followId;
        setFollowData({ isFollowing: true, followId });
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        if (followData.followId) {
          await unfollowResource(followData.followId);
        }
        setFollowData({ isFollowing: false, followId: null });
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <span 
      className="hashtag" 
      style={{ position: "relative", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={toggleFollow}
    >
      #{tag}
      {followData.isFollowing && (
        <span style={{ width: "6px", height: "6px", background: "#3b82f6", borderRadius: "50%", display: "inline-block" }} title="Following"></span>
      )}
      
      {isHovered && (
        <div style={{
          position: "absolute",
          bottom: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          marginBottom: "6px",
          background: "#1a1a1a",
          color: "#fff",
          fontSize: "11px",
          fontWeight: 600,
          padding: "4px 8px",
          borderRadius: "4px",
          whiteSpace: "nowrap",
          zIndex: 10,
          pointerEvents: "none",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
        }}>
          {followData.isFollowing ? "Unfollow" : "+ Follow"}
          {/* Tooltip Arrow */}
          <div style={{
            position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
            borderWidth: "4px", borderStyle: "solid", borderColor: "#1a1a1a transparent transparent transparent"
          }}></div>
        </div>
      )}
    </span>
  );
}

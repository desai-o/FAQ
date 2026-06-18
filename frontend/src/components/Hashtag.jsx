import { useState } from "react";
import { apiRequest } from "../api/client";

export default function Hashtag({ tag }) {
  const [isHovered, setIsHovered] = useState(false);
  const [followData, setFollowData] = useState({
    isFollowing: false,
    followId: null,
  });

  const toggleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!followData.isFollowing) {
      try {
        const data = await apiRequest("/follows", {
          method: "POST",
          body: JSON.stringify({
            followable_type: "tag",
            followable_id: tag,
          }),
        });

        setFollowData({
          isFollowing: true,
          followId: data.id || followData.followId,
        });
      } catch (err) {
        // Handle already-following responses gracefully
        if (
          err.message?.includes("already") ||
          err.message?.includes("exists")
        ) {
          setFollowData((prev) => ({
            ...prev,
            isFollowing: true,
          }));
        } else {
          console.error(err);
        }
      }
    } else {
      try {
        if (followData.followId) {
          await apiRequest(`/follows/${followData.followId}`, {
            method: "DELETE",
          });
        }

        setFollowData({
          isFollowing: false,
          followId: null,
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <span
      className="hashtag"
      style={{
        position: "relative",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={toggleFollow}
    >
      #{tag}

      {followData.isFollowing && (
        <span
          style={{
            width: "6px",
            height: "6px",
            background: "#3b82f6",
            borderRadius: "50%",
            display: "inline-block",
          }}
          title="Following"
        />
      )}

      {isHovered && (
        <div
          style={{
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
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          {followData.isFollowing ? "Unfollow" : "+ Follow"}

          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              borderWidth: "4px",
              borderStyle: "solid",
              borderColor:
                "#1a1a1a transparent transparent transparent",
            }}
          />
        </div>
      )}
    </span>
  );
}
function ensureStats(statsMap, courseId) {
  const key = courseId.toString();
  const current = statsMap.get(key) || {
    present: 0,
    absent: 0,
    percentage: 0
  };

  return {
    key,
    stats: {
      present: Number(current.present || 0),
      absent: Number(current.absent || 0),
      percentage: Number(current.percentage || 0)
    }
  };
}

function applyAttendanceStatus(student, courseId, previousStatus, nextStatus) {
  const { key, stats } = ensureStats(student.attendanceStats, courseId);

  if (previousStatus === "Present") {
    stats.present = Math.max(0, stats.present - 1);
  } else if (previousStatus && previousStatus !== "Excused") {
    stats.absent = Math.max(0, stats.absent - 1);
  }

  if (nextStatus === "Present") {
    stats.present += 1;
  } else if (nextStatus && nextStatus !== "Excused") {
    stats.absent += 1;
  }

  const total = stats.present + stats.absent;
  stats.percentage = total > 0 ? (stats.present / total) * 100 : 0;

  student.attendanceStats.set(key, stats);
}

module.exports = {
  applyAttendanceStatus
};

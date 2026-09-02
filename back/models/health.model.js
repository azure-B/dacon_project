function getStatus() {
  return {
    ok: true,
    message: "서버가 정상적으로 동작 중입니다.",
  };
}

module.exports = {
  getStatus,
};

// Twelve small, authored routes. 0 = / mirror, 1 = \ mirror.
// Solution angles are used for optional hints and level-validation tests.
const mirror = (x, y, solution, angle = 1 - solution) => ({ x, y, solution, angle });
const pot = (x, y) => ({ x, y });
export const LEVELS = [
  { id: 1, name: '첫 번째 햇살', note: '거울을 한 번 돌려, 잠든 잎을 깨워 주세요.', source: { x: -1, y: 2, dir: 0 }, mirrors: [mirror(2, 2, 0)], plants: [pot(2, 0)], rocks: [] },
  { id: 2, name: '창문을 열면', note: '빛은 거울을 만날 때마다 길을 바꿔요.', source: { x: 1, y: -1, dir: 1 }, mirrors: [mirror(1, 2, 1), mirror(3, 0, 0, 0)], plants: [pot(3, 2)], rocks: [pot(0, 3)] },
  { id: 3, name: '한 굽이 더', note: '두 개의 거울로 햇살을 이어 보세요.', source: { x: -1, y: 3, dir: 0 }, mirrors: [mirror(2, 3, 0), mirror(2, 1, 1), mirror(0, 0, 0, 1)], plants: [pot(0, 1)], rocks: [pot(3, 0)] },
  { id: 4, name: '나란히, 초록', note: '화분을 지나간 빛은 계속 나아가요.', source: { x: 3, y: -1, dir: 1 }, mirrors: [mirror(3, 2, 0), mirror(1, 2, 1)], plants: [pot(2, 2), pot(1, 0)], rocks: [pot(0, 3)] },
  { id: 5, name: '길어진 오후', note: '조금 멀리 돌아가도 괜찮아요.', source: { x: -1, y: 1, dir: 0 }, mirrors: [mirror(3, 1, 1), mirror(3, 3, 0), mirror(0, 0, 1, 0), mirror(1, 2, 0, 1)], plants: [pot(0, 3)], rocks: [pot(2, 0)] },
  { id: 6, name: '잎사귀 인사', note: '모든 잎사귀에 햇살이 닿으면 완성이에요.', source: { x: 1, y: 4, dir: 3 }, mirrors: [mirror(1, 1, 0), mirror(3, 1, 1), mirror(0, 0, 1, 0)], plants: [pot(1, 2), pot(3, 3)], rocks: [pot(0, 3)] },
  { id: 7, name: '작은 산책', note: '창가를 천천히 돌아, 가장 작은 화분까지.', source: { x: -1, y: 3, dir: 0 }, mirrors: [mirror(2, 3, 0), mirror(2, 1, 1), mirror(0, 1, 1), mirror(3, 0, 0, 1)], plants: [pot(1, 3), pot(0, 0)], rocks: [pot(3, 3)] },
  { id: 8, name: '다른 쪽 창', note: '오늘은 반대쪽 창에서 햇살이 들어와요.', source: { x: 4, y: 0, dir: 2 }, mirrors: [mirror(1, 0, 0), mirror(1, 2, 1), mirror(3, 2, 0), mirror(0, 3, 1, 0)], plants: [pot(2, 2), pot(3, 1)], rocks: [pot(0, 1)] },
  { id: 9, name: '한 바퀴의 여유', note: '서두르지 않아도, 빛은 길을 찾을 거예요.', source: { x: 0, y: -1, dir: 1 }, mirrors: [mirror(0, 2, 1), mirror(2, 2, 0), mirror(2, 0, 1), mirror(3, 3, 0, 1)], plants: [pot(1, 2), pot(1, 0)], rocks: [pot(1, 3)] },
  { id: 10, name: '그늘도 필요해', note: '달 표시 화분은 햇빛이 닿지 않게 지켜 주세요.', source: { x: 3, y: 4, dir: 3 }, mirrors: [mirror(3, 1, 1), mirror(0, 1, 0), mirror(0, 3, 1), mirror(1, 0, 0, 1), mirror(2, 2, 1, 0)], plants: [pot(1, 1), pot(2, 3)], shadePlants: [pot(1, 2)], rocks: [pot(0, 0)] },
  { id: 11, name: '다정한 모퉁이', note: '햇빛 화분을 깨우고, 그늘 화분은 쉬게 해 주세요.', source: { x: -1, y: 2, dir: 0 }, mirrors: [mirror(1, 2, 1), mirror(1, 3, 1), mirror(3, 3, 0), mirror(3, 0, 1), mirror(0, 0, 1, 0), mirror(2, 1, 1, 0)], plants: [pot(2, 3), pot(1, 0)], shadePlants: [pot(0, 1)], rocks: [pot(0, 3)] },
  { id: 12, name: '햇빛이 머무는 곳', note: '서로 다른 잎사귀에게, 꼭 맞는 하루를.', source: { x: 2, y: -1, dir: 1 }, mirrors: [mirror(2, 1, 0), mirror(1, 1, 0), mirror(1, 3, 1), mirror(3, 3, 0), mirror(3, 0, 1), mirror(0, 0, 1, 0), mirror(0, 2, 0, 1)], plants: [pot(2, 3), pot(1, 0), pot(2, 0)], shadePlants: [pot(0, 1)], rocks: [pot(2, 2)] },
].map(level => ({ shadePlants: [], ...level, size: 4 }));

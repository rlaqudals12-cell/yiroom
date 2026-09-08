// 일·월 검사와 영수증 발급을 하나의 원자 연산으로 묶어 전송 방식 간 경합을 막는다.
export const RESERVE_COACH_TURN = `
local day = tonumber(redis.call('GET', KEYS[1]) or '0')
local month = tonumber(redis.call('GET', KEYS[2]) or '0')
if redis.call('EXISTS', KEYS[3]) == 1 then return {0, 'duplicate_request', day, month} end
if day >= tonumber(ARGV[1]) then return {0, 'daily_limit', day, month} end
if month >= tonumber(ARGV[2]) then return {0, 'monthly_limit', day, month} end
redis.call('INCR', KEYS[1])
redis.call('EXPIREAT', KEYS[1], ARGV[3])
redis.call('INCR', KEYS[2])
redis.call('EXPIREAT', KEYS[2], ARGV[4])
redis.call('HSET', KEYS[3], 'state', 'reserved')
redis.call('EXPIREAT', KEYS[3], ARGV[5])
return {1, 'reserved', day + 1, month + 1}
`;

// 모델 호출 후 취소는 청구 취소를 보장하지 않으므로 환급하지 않는다.
export const SETTLE_COACH_TURN = `
if redis.call('HGET', KEYS[3], 'state') ~= 'reserved' then return 0 end
if ARGV[1] == '0' then
  for i = 1, 2 do
    if tonumber(redis.call('GET', KEYS[i]) or '0') > 0 then redis.call('DECR', KEYS[i]) end
  end
end
redis.call('HSET', KEYS[3], 'state', 'settled', 'modelCalled', ARGV[1], 'usage', ARGV[2], 'modelVersion', ARGV[3])
return 1
`;

#!/bin/bash
# Keep-alive script for Next.js dev server
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
if [ "$RESPONSE" != "200" ]; then
  echo "$(date): Server down (HTTP $RESPONSE). Restarting..." >> /home/z/my-project/keepalive.log
  cd /home/z/my-project
  pkill -f 'next dev' 2>/dev/null
  pkill -f 'node.*server.js' 2>/dev/null
  sleep 2
  rm -rf .next 2>/dev/null
  nohup bun run dev >> dev.log 2>&1 &
  echo "$(date): Server restarted" >> /home/z/my-project/keepalive.log
  sleep 20
else
  echo "$(date): Server OK (HTTP $RESPONSE)" >> /home/z/my-project/keepalive.log
fi

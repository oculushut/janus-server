while true; do
ps -C node -o pid=,%mem=,vsz= >> memWatch.log
sleep 5
done

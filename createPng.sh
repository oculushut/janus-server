gnuplot <<- EOF
    set term png small size 800,600
    set ylabel "VSZ"
    set y2label "%MEM"
    set output "memWatch.png"
    set ytics nomirror
    set y2tics nomirror in
    set yrange [0:*]
    set y2range [0:*]
    plot "./memWatch.log" using 3 with lines axes x1y1 title "VSZ", \
    "./memWatch.log" using 2 with lines axes x1y2 title "%MEM"
EOF

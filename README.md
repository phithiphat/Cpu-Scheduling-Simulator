# ⚙️ CPU Scheduling Simulator

A modern, responsive web application for simulating and comparing CPU Scheduling algorithms, built with vanilla HTML, CSS, and JavaScript.

## 🚀 Features

- **Algorithms Supported:**
  - **FCFS** (First-Come, First-Served)
  - **SJF** (Shortest Job First - Non-preemptive)
  - **Round Robin** (RR with configurable Time Quantum, default $Q = 2$)
- **Simulation Setup:**
  - Configurable number of processes ($P_1$ to $P_n$)
  - All processes have Arrival Time ($AT = 0$)
  - Manual Burst Time ($BT$) input or 🎲 Randomizer
- **Visualizations & Analytics:**
  - **Precision-Aligned Gantt Chart:** Timeline ruler, time range badges, boundary timestamps, process legend, and execution order.
  - **Performance Metrics:** Average Waiting Time ($WT$), Average Turnaround Time ($TAT$), and Total Execution Time.
  - **Process Details Table:** Detailed breakdown of $AT$, $BT$, $ST$, $CT$, $TAT$, and $WT$ per process.
  - **Algorithm Comparison:** Side-by-side performance table, comparative bar chart, and best algorithm indicator.
- **UI/UX:**
  - Dark Mode & Light Mode toggle with local persistence.
  - Sleek dashboard interface inspired by modern developer tooling.

## 🛠️ Getting Started

Simply open `index.html` in any modern web browser:

```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

## 👥 สมาชิกในกลุ่ม

- นาย พิธิพัฒน์ เจียง รหัส 1670706959 Sec 327F หน้าที่ การออกแบบและพัฒนาอัลกอริทึม
- นาย พัฒธิวัฒน์ เจียง รหัส 1670706967 Sec 327F หน้าที่ การออกแบบ User Interface
- นาย ธนกฤต พวงแก้ว รหัส 1670703998 Sec 327F หน้าที่ การออกแบบกรณีทดสอบ
- นาย ณัฐวุฒิ อุดมศักดิ์ รหัส 1670706975 Sec 327F หน้าที่ การออกแบบกรณีทดสอบ

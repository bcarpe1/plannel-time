const app = Vue.createApp({
  data() {
    const date = new Date();
    return {
      timeEntryList: [],
      dateStartTimes: [],
      month: date.getMonth()+1,
      year: date.getFullYear(),
      editEntries: []
    };
  },
  mounted() {
    if(localStorage.timeEntryList && localStorage.timeEntryList != "null") {
      this.timeEntryList = JSON.parse(localStorage.timeEntryList);
    }
  },
  methods: {
    addNewEntry(date) {
      let id = 0;
      if(this.timeEntryList && this.timeEntryList.length) {
        id = Math.max(...(this.timeEntryList.map(x => x.id))) + 1;
      }
      let startTime = date.getTime();
      let currentDate = new Date();
      startTime += (Date.now() - currentDate.getTimezoneOffset() * 60000) % 86400000;
      this.timeEntryList.push({
        id: id,
        startTime: startTime,
        tempStartTime: this.timeFromDate(new Date(startTime)),
        timeMarked: false,
        editing: true,
        entered: false,
        new: true
      });
    },
    cancelEdit(timeEntry) {
      if(timeEntry.new) {
        const index = this.timeEntryList.indexOf(timeEntry);
        this.timeEntryList.splice(index,1);
      }
      else
      {
        timeEntry.editing = false;
      }
    },
    daySummariesForDate(date) {
      const daysEntries = this.timeEntryList
        .filter((x) => (
          date.getTime() <= x.startTime &&
          date.getTime() + 86400000 > x.startTime
        ));
      let summaries = [];
      let totalHours = 0;
      for(i = 0; i < daysEntries.length; i++) {
        const entry = daysEntries[i];
        if(!entry.projectCode) continue;
        const id = `${entry.projectCode}-${entry.storyRef}`;
        let summary = summaries.find(summary => summary.id === id);
        let duration = this.getTimeEntryDurationMin(entry);
        totalHours += duration;
        if(summary === undefined) {
          summaries.push (
            { 
              id,
              projectCode: entry.projectCode,
              storyRef: entry.storyRef,
              durationMin: duration
            }
          );
        }
        else {
          summary.durationMin += duration;
        }
      }
      summaries.push (
        { 
          id: 'Total',
          projectCode: 'Total',
          durationMin: totalHours
        }
      );
      return summaries;
    },
    deleteTimeEntry(timeEntry) {
      const index = this.timeEntryList.indexOf(timeEntry);
      this.timeEntryList.splice(index,1);
      localStorage.timeEntryList = JSON.stringify(this.timeEntryList);
    },
    editTimeEntry(timeEntry) {
      timeEntry.editing = true;
      const startTime = new Date(timeEntry.startTime);
      timeEntry.tempStartTime = this.timeFromDate(startTime);
      timeEntry.tempEntered = timeEntry.entered;
    },
    getTimeEntryDurationMin(timeEntry) {
      const index = this.timeEntryList.indexOf(timeEntry);
      if(index == this.timeEntryList.length-1) {
        return 0;
      }

      const nextTimeEntry = this.timeEntryList[index+1];
      if(new Date(timeEntry.startTime).getDate() != new Date(nextTimeEntry.startTime).getDate()) {
        return 0;
      }

      return (nextTimeEntry.startTime - timeEntry.startTime)/60000;
    },
    saveEdits(timeEntry) {
      timeEntry.editing = false;
      if(timeEntry.tempStartTime) {
        const startTime = timeEntry.tempStartTime;
        const hour = startTime.substring(0,startTime.indexOf(":"));
        const minute = startTime.substring(startTime.indexOf(":")+1);
        const originalStartTime = new Date(timeEntry.startTime);
        timeEntry.tempStartTime = new Date(originalStartTime.getFullYear(), originalStartTime.getMonth(), originalStartTime.getDate(), parseInt(hour), parseInt(minute));
        timeEntry.startTime = timeEntry.tempStartTime.getTime();
      }
      timeEntry.projectCode = timeEntry.tempProjectCode;
      timeEntry.storyRef = timeEntry.tempStoryRef;
      timeEntry.note = timeEntry.tempNote;
      timeEntry.entered = timeEntry.tempEntered;
      timeEntry.new = false;
      
      this.timeEntryList.sort((x,y) => x.startTime < y.startTime ? -1 : 1);
      localStorage.timeEntryList = JSON.stringify(this.timeEntryList);
    },
    setStartTime(event, timeEntry) {
      timeEntry.tempStartTime = event.target.value;
    },
    setDurationHours(event, timeEntry) {
      timeEntry.tempDurationTime = event.target.value;
    },
    setDurationDecimal(event, timeEntry) {
      timeEntry.tempDurationDecimal = event.target.value;
    },
    setProjectCode(event, timeEntry) {
      timeEntry.tempProjectCode = event.target.value;
    },
    setStoryRef(event, timeEntry) {
      timeEntry.tempStoryRef = event.target.value;
    },
    setNote(event, timeEntry) {
      timeEntry.tempNote = event.target.value;
    },
    timeFromDate(date) {
      if(date == undefined) return "";
      const hrs = date.getHours() < 10 ? "0" + date.getHours(): date.getHours() + "";
      const mins = date.getMinutes() < 10 ? "0" + date.getMinutes(): date.getMinutes() + "";
      return hrs + ":" + mins;
    },
    timeFromDateDisplay(date) {
      if(date == undefined) return "";
      const hrs = (date.getHours() == 0 ? 12 : date.getHours() <= 12 ? date.getHours() : date.getHours() - 12) + "";
      const mins = date.getMinutes() < 10 ? "0" + date.getMinutes(): date.getMinutes() + "";
      const amPm = date.getHours() < 12 ? "AM" : "PM"
      return hrs + ":" + mins + " " + amPm;
    },
    timeEntriesForDate(date) {
      let list = this.timeEntryList
        .filter((x) => (
          date.getTime() <= x.startTime &&
          date.getTime() + 86400000 > x.startTime
        ));

      list.sort((x,y) => x.startTime < y.startTime ? -1 : 1);

      return list;
    },
    toggleEntered(timeEntry) {
      if(timeEntry.editing){
        timeEntry.tempEntered = !timeEntry.tempEntered
      }
      else {
        timeEntry.entered = !timeEntry.entered;
        localStorage.timeEntryList = JSON.stringify(this.timeEntryList);
      }
    },
    updateTimeframe() {
      console.log('timeframe update');
    },
    weekSummariesForDate(date) {
      const weekEntries = this.timeEntryList
        .filter((x) => (
          date.getTime() - 518400000 <= x.startTime &&
          date.getTime() + 86400000 > x.startTime
        ));
      let summaries = [];
      let totalHours = 0;
      for(i = 0; i < weekEntries.length; i++) {
        const entry = weekEntries[i];
        if(!entry.projectCode) continue;
        const id = `${entry.projectCode}`;
        let summary = summaries.find(summary => summary.id === id);
        let duration = this.getTimeEntryDurationMin(entry);
        totalHours += duration;
        if(summary === undefined) {
          summaries.push (
            { 
              id,
              projectCode: entry.projectCode,
              durationMin: duration
            }
          );
        }
        else {
          summary.durationMin += duration;
        }
      }
      summaries.push (
        { 
          id: 'Total',
          projectCode: 'Total',
          durationMin: totalHours
        }
      );
      return summaries;
    },
    displayDayOfWeek(dayIndex) {
      const weekday = new Array(7);
      weekday[0] = "Sunday";
      weekday[1] = "Monday";
      weekday[2] = "Tuesday";
      weekday[3] = "Wednesday";
      weekday[4] = "Thursday";
      weekday[5] = "Friday";
      weekday[6] = "Saturday";

      return weekday[dayIndex];
    },
    displayHoursTime(timeinMinutes) {
      const minutes = timeinMinutes%60;
      return Math.floor(timeinMinutes/60) + ":" + (minutes < 10 ? '0'+minutes : minutes);
    },
    displayHoursDecimal(timeinMinutes) {
      return (timeinMinutes/60).toFixed(2);
    }
  },
  computed: {
    datesWithinMonth() {
      var dates = [];
      var date = new Date(this.year, this.month-1, 1);
      while(date.getMonth() === this.month-1)
      {
        dates.push(date);
        date = new Date(this.year, this.month-1, date.getDate() + 1);
      }
      return dates;
    },
    weeksWithinMonth() {
      var weeks = [];
      var week = {
        dates: []
      };
      var date = new Date(this.year, this.month-1, 1);
      while(date.getMonth() === this.month-1)
      {
        week.dates.push(date);
        if(date.getDay() === 6 || new Date(this.year, this.month-1, date.getDate() + 1).getMonth() === this.month) {
          week.summary = this.weekSummariesForDate(date);
          week.lastDate = week.dates[week.dates.length-1];
          weeks.push(week);
          week = {
            dates: []
          };
        }
        date = new Date(this.year, this.month-1, date.getDate() + 1);
      }
      return weeks;
    }
  }
});

app.mount('#planneltime');

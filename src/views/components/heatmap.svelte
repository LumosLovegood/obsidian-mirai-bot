<script lang="ts">
    import SvelteHeatmap from 'svelte-heatmap';
    export let year = window.moment().year();
    export let data: {date: string, value: number}[];
    export let colors = ["#a1dab4", "#42b6c4", "#2c7fb9", "#263494"];
    export let emptyColor = "#ecedf0";
    export let cellRadius = '50%';
    export let type = "yearly";
    let startDate = `${year}/01/01`;
    let endDate = `${year}/12/31`;

  let monthlabel = [
    "",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  if(type == "monthly"){
    monthlabel = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  }
</script>

<SvelteHeatmap
  {data}
  view={type}
  {startDate}
  {endDate}
  monthLabels={monthlabel}
  allowOverflow="true"
  {colors}
  {emptyColor}
  {cellRadius}
/>
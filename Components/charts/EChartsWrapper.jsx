import * as echarts from "echarts/core";
import {
  LineChart,
  BarChart,
  PieChart,
  MapChart,
  GaugeChart
} from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  VisualMapComponent
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  VisualMapComponent,
  LineChart,
  BarChart,
  PieChart,
  MapChart,
  GaugeChart,
  CanvasRenderer
]);

export default echarts;



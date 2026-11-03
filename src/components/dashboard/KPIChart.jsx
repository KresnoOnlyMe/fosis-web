import React from "react";

import {
LineChart,
Line,
XAxis,
YAxis,
Tooltip,
ResponsiveContainer
}
from "recharts";


const data=[

{
month:"Jan",
value:80
},

{
month:"Feb",
value:88
},

{
month:"Mar",
value:92
}

];



export default function KPIChart(){


return (

<div className="dashboard-chart-card">


<h3>
Trend Performa Engineer
</h3>



<ResponsiveContainer
width="100%"
height={260}
>


<LineChart data={data}>


<XAxis
dataKey="month"
/>


<YAxis/>


<Tooltip/>


<Line

dataKey="value"

/>


</LineChart>



</ResponsiveContainer>


</div>


)

}
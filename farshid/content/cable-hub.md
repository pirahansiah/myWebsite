---
layout: farshid_default
title: "Cable Hub"
permalink: /notes/cable-hub/
description: "Practical cabling notes for a laptop, a Windows PC and a Mac cluster: where Thunderbolt 5 (and USB4/Intel RDMA) actually pays off for multi-camera capture and split LLM inference, when DisplayPort 2.1 beats HDMI 2.2, and which hubs, adapters and power banks hold up."
---

the cable is play important rule in any part of project
based on my experience i have some idea
- use thunderbolt cable (i use apple thunderbolt 5 )
	- if possible thunderbolt 5 cable support intel **Remote Direct Memory Access (RDMA)** also can use for AMD USB 4
	- the speed and the bandwidth and power delivery is grantee 
	- the camera system has less problem with bandwidth transfer data and use multiple camera system
	- the thunderbolt cable must verify minimum bandwidth to certified so it must has minimum quality and you do not need to worry about connections

	|Feature| Lenovo Legion 5 15AGP11 Setup| Mac Studio Cluster Setup|
|---|---|---|
|**Connection Speed**|~10 to 20 Gbps (Host Network Limit)|Up to 80–120 Gbps (Thunderbolt 5)|
|**How It Handles Data**|**CPU Bottleneck**: The CPU processes every single packet.|**True RDMA**: Data bypasses the CPU completely.|
|**System Memory Speed**|~90 GB/s (Dual-Channel DDR5-5600)|460 GB/s to 1.2 TB/s (Unified Memory)|
|**LLM Inference Speed**|**Slow**: Split tokens cause lag over the network.|**Fast**: Acts like one single giant graphics card.|


- use DP 2.1 first HDMI 2.2 second
	- display port cable it is support max for the monitor specially 3D display 
	- only HDMI 2.2 - 96 Gbps Ultra High Speed
		- 16K 8K HDMI 2.2 Cable 2 m, 96 Gbps Ultra High Speed, 16K @ 60Hz, 8K @ 240Hz, 4K @ 480Hz, eARC, HDR10+, Dolby Vision, HDCP 2.3,
	- only (DisplayPort) DP 2.1
		- DisplayPort 2.1/2.1b: Offers up to 80 Gbps bandwidth and introduces active DP80 Low Loss (LL) 
- Hub 
	- i tested many different hub and I found that only the CalDigit thunderbolt 5 is good for windows, mac, linux 
- adaptor / charger 
	- if you use adaptor that has many ports like 2 usbc and one 1 usbA you must know the Watt is divided between all ports if you use all at the same time
- power-bank
	- use the model that support Laptop Power Bank, 165W

---
layout: farshid_default
title: "Edge AI & Computer Vision Beratung in Deutschland"
permalink: /notes/edge-ai-beratung/
description: "Dr. Farshid Pirahansiah — freiberuflicher Berater für Embedded Edge AI und Computer Vision in Deutschland. Optimierung von C++, CUDA, TensorRT, OpenVINO und NVIDIA Jetson für produktive Vision-Systeme. 12+ Jahre, 21 Publikationen, 3 Patente."
tags: [edge-ai-beratung, computer-vision-beratung, deutschland, embedded-ai, nvidia-jetson, tensorrt, cuda, openvino, quantisierung, industrielle-bildverarbeitung, cpp]
lang: de
translation: edge-ai-consulting-germany
---

# Edge AI & Computer Vision Beratung in Deutschland

Ich bin **Dr. Farshid Pirahansiah** — freiberuflicher Berater für **Embedded Edge AI**
und **Computer Vision** für Engineering-Teams in **Deutschland**. **12+ Jahre**
Berufserfahrung, **21 Publikationen**, **3 Patente**. Zusammengearbeitet wird remote im
ganzen Bundesgebiet, vor Ort für Kick-offs, Integrationswochen und Labortests.

Der Kern der Arbeit ist selten ein neues Modell. Meistens gibt es schon ein Modell, eine
Platine, einen Termin — und ein System, das zu langsam, zu heiß oder auf der Zielhardware
nicht reproduzierbar läuft. Genau dort setze ich an: Messen auf dem Gerät, Optimieren bis
es die Rate hält, und zwar nachvollziehbar dokumentiert.
*English version:* [Embedded Edge AI & Computer Vision Consultant in Germany](/farshid/content/edge-ai-consulting-germany.md).

## Leistungen

- **Produktionsreife Vision-Pipelines** — Kameraerfassung, Kalibrierung, Vor- und
  Nachverarbeitung und Inferenz so verdrahtet, dass die Bildrate auch unter Last hält.
- **Hardware-nahe Optimierung** — Quantisierung, Kernel- und Graph-Optimierung, plus eine
  belastbare Messung dessen, was die Zielplattform wirklich leisten kann.
- **Prototypen-Rettung & technische Bewertung** — vom funktionierenden Demo zum Produkt,
  oder eine Hardware-/KI-Entscheidung, die vor der Budgetfreigabe fallen muss.
- **Wissen im Team** — gemeinsames Arbeiten und Code-Review, damit das Know-how im
  Unternehmen bleibt und nicht in einer Präsentation.

## Hardware und Software, auf der ich optimiere

| Ebene | Werkzeuge und Plattformen |
|---|---|
| Edge-Beschleuniger | NVIDIA Jetson (AGX Orin, Orin Nano, Xavier), Google Coral TPU, Hailo-8, Intel NCS2, Kria KV260 (FPGA) |
| GPU & Runtime | CUDA, TensorRT, cuDNN, OpenVINO, ONNX Runtime, GGUF/llama.cpp, MLX/CoreML auf Apple Silicon |
| Präzision & Kompression | INT8-/FP16-Quantisierung, Kalibrierung, Layer-Fusion, strukturiertes Pruning, Speicher-Budgetierung |
| Vision & C++ | C++17/20, OpenCV, G-API, PyTorch → TensorRT Deployment, Python/Numba/Cython-Hotspots |
| Systeme | Echtzeit-Pipelines, Multi-Kamera-Synchronisation, RDMA/Thunderbolt-Capture, Thermal- und Power-Limits, MIPI/GStreamer |

## Typische Fragestellungen aus der Praxis

### „Unser Detektor läuft mit 4 FPS auf dem bestellten Jetson"

Ein FP32-PyTorch-Modell auf einem Embedded-Gerät ist der Klassiker. Die Arbeit: ein
TensorRT-Engine für genau diese Zielplattform bauen, INT8 auf den eigenen Bildern
kalibrieren, die Vorverarbeitung auf die GPU verlagern und batchten, was sich batchen
lässt. Hintergrundnotizen: [CV-, DL- & ML-Optimierungsleitfaden](/farshid/content/optimization-index.md)
und [PyCUDA: C-Kernel aus Python](/farshid/content/note-pycuda.md).

### „Auf dem Rechner läuft es, auf dem Gerät nicht"

Speichergrenzen, Thermal Throttling und ein anderer Operator-Satz sind drei verschiedene
Probleme, die gleich aussehen. Die Arbeit: das echte Budget auf dem Gerät messen, das
Profil auswerten, und das Modell so weit verkleinern, dass es in den vorhandenen Speicher
passt — dieselbe Methode, mit der ich ein Sprachmodell auf 8 GB zum Laufen bringe
([Notizen](/farshid/content/local-llm-hermes-low-ram.md)).

### „Wir haben Kameras, aber das System sieht nicht zuverlässig"

Kalibrierung, Synchronisation und Geometrie kommen vor den neuronalen Netzen:
Multi-Kamera-Rigs, die nicht deckungsgleich sind, Optischer Fluss, der bei schneller
Bewegung oder wechselndem Licht bricht, 3D-Rekonstruktion, die driftet. Siehe
[3D-Vision & Multi-Kamera-Systeme](/farshid/content/note-3d-vision.md),
[Optical Flow: Herausforderungen und Lösungen](/farshid/content/note-optical-flow.md) und
[Verkabelung für Multi-Kamera-Capture](/farshid/content/cable-hub.md).

### „Das Modell muss aufs Gerät — ohne Cloud, ohne GPU"

Kleine Modelle für Edge-Geräte: passende Architektur wählen, quantisieren, lokal
ausführen — vom 1-Bit-4B-Sprachmodell auf einem alten Laptop bis zur
[Bildgenerierung mit 8 GB](/farshid/content/qwen-image-21-local.md) und der
[ESP32-C3-Board-Arbeit](/farshid/content/esp32-c3-oled.md), bei der das gesamte Budget ein
paar hundert Kilobyte beträgt.

## Wie eine Zusammenarbeit abläuft

1. **Gespräch über den tatsächlichen Engpass** — Modell, Hardware, Termin und die
   Genauigkeit, die nicht verhandelbar ist.
2. **Kurzes technisches Audit** — Profiling auf Ihrer Zielhardware, danach ein schriftliches
   Ergebnis: was langsam ist, was machbar ist, was nicht passt und wo das Risiko liegt.
3. **Umsetzung gemeinsam** — ich arbeite in Ihrem Repository und Review-Prozess, in C++,
   Python und CUDA, in Ihrer Toolchain und CI.
4. **Übergabe** — Pipelines, Profiling-Skript und Begründung, so dokumentiert, dass die
   nächste Entwicklerin oder der nächste Entwickler es reproduzieren kann.

## Vor Ort und remote

- **Remote bundesweit** — gleiche Zeitzone, auf Deutsch oder Englisch.
- **Vor Ort** für Kick-offs, Integrationswochen und Labortests, unter anderem in
  **München, Stuttgart, Berlin und Heidelberg** — und überall dort, wo man mit Bahn oder
  kurzem Flug hinkommt.
- **Europaweit** (EU/EWR) sowie vollständig remote darüber hinaus.

## Nachweise

- **21 Publikationen** — Fachartikel, Konferenzbeiträge und Buchkapitel:
  [Liste](/farshid/content/atlas.md#publications).
- **3 Patente** — Erkennung bewegter Fahrzeuge, Gesichtsanalyse für Werbung,
  GAN-basierte Gesichtsaugmentation:
  [Patentseiten](/farshid/content/atlas.md#publications).
- **Google Scholar** — [Zitationsprofil](https://scholar.google.com/citations?user=GvCEy4QAAAAJ&hl=en),
  h-Index 8, 142 Zitierungen.
- **Rechtliches** — [Impressum](/farshid/content/impressum.md) und
  [Datenschutzerklärung](/farshid/content/privacy.md).

## Kontakt

- **E-Mail** — [info@pirahansiah.com](mailto:info@pirahansiah.com), mit Hardware, Modell
  und der Zielgröße, die erreicht werden muss.
- **Termin** — [calendly.com/pirahansiah/farshid](https://calendly.com/pirahansiah/farshid).
- **Alles Weitere** — [Atlas](/farshid/content/atlas.md) oder
  [alle Seiten](/farshid/content/wiki.md).

*English version of this page:
[Embedded Edge AI & Computer Vision Consultant in Germany](/farshid/content/edge-ai-consulting-germany.md).*

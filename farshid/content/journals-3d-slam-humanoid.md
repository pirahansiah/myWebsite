Survey of 3D SLAM techniques for localization, mapping, and humanoid robot applications.

3D_SLAM_Simultaneous_Localization_And_Mapping_Trends_And_Humanoid_Robot_Linkages

https://www.pirahansiah.com/notes/pubs/journals/3D_SLAM_Simultaneous_Localization_And_Mapping_Trends_And_Humanoid_Robot_Linkages/

[spotify](https://podcasters.spotify.com/pod/show/pirahansiah/episodes/3D-SLAM-Simultaneous-Localization-And-Mapping-Trends-And-Humanoid-Robot-Linkages-e2prg07)

[PDF Download](http://journalarticle.ukm.my/6644/1/4429-10302-1-SM.pdf  )

  ![3D SLAM Simultaneous Localization And Mapping Trends And Humanoid Robot Linkages](/farshid/assets/img/3d-slam-humanoid-robots.png)

  <img src="/farshid/assets/img/3d-slam-humanoid-robots.png" alt="Simultaneous Localization And Mapping Trends And Humanoid Robot Linkages" style="max-width: 100%; height: auto;">

# Simultaneous Localization and Mapping Trends and Humanoid Robot Linkages

## 1. Introduction
- SLAM: Simultaneous Localization and Mapping
  - Real-time map creation and localization
  - Robotics application: goal determination, motion planning
  - Usage in rescue missions, medical field, pipeline inspection, and more
  - Challenges: sensor uncertainty, correspondence, loop closing, time complexity

## 2. SLAM Methods
- Kalman Filter (KF)
  - Bayesian filter handling uncertainty
  - Extended KF (EKF), Unscented KF (UKF), SEIF improvements
  - Challenges: computational resources, landmark growth
- Particle Filter
  - Non-parametric recursive algorithm
  - Handles non-linearity and non-Gaussian noise
  - FastSLAM algorithms: O(P log L) complexity
- Graph-based SLAM
  - Nodes as robot poses, edges as spatial constraints
  - State-of-the-art for speed and accuracy
- Feature-based SLAM
  - Describes environments using point features
  - Laser ranging systems for mapping

## 3. SLAM Evaluation Methods
- Allocated Resources
  - Processing time and memory usage
  - EKF, CEKF, and UKF comparisons
- Precision and Noise
  - Reducing drift and noise
  - Odometry, laser, radar, camera usage
- Environmental Factors
  - Outdoor, indoor, underwater, dynamic environments
  - 3D maps, point maps for environmental challenges

## 4. SLAM for Humanoid Robots
- Humanoid challenges: degrees of freedom, camera variability
- Solutions:
  - Stereo vision setup
  - Local 3D maps for footstep planning
  - Real-time VSLAM using single camera (e.g., HRP-2)
  - GPU-accelerated tracking for humanoid tasks

## 5. Datasets for SLAM
- Online datasets for SLAM research
  - Indoor and outdoor datasets
  - Popular datasets: Intel research lab, MIT CSAIL, FHW Museum
- Benchmark datasets
  - Ground truth needed for accurate mapping

## 6. Conclusion and Future Work
- New combinatory SLAM methods: grid-based FastSLAM, graph-based SLAM
- Challenges: 3D SLAM for humanoid robots, noisy vision from robot motion
- Future research: stereo vision SLAM in real-world environments, stereo video stabilization, 3D mapping
# Ориентиры суставов моделей (координаты после prep.py: Blender Z-вверх, лицо к -Y; L = левая сторона персонажа, +X).
# Правая сторона зеркалится, если не задана. map — перенос весов родного рига; allow — ограничение костей по материалу.
RIG={
 'hero':dict(L={'hipL':(0.09,0,0.93),'kneeL':(0.10,-0.02,0.5),'ankleL':(0.14,0.02,0.08),'neck':(0,0,1.5),'top':(0,0,1.8),
   'shL':(0.17,-0.02,1.41),'elL':(0.45,-0.07,1.36),'wrL':(0.7,-0.14,1.34),'fiL':(0.84,-0.2,1.31)}),
 'sota':dict(L={'hipL':(0.09,0,0.93),'kneeL':(0.13,-0.02,0.5),'ankleL':(0.17,0,0.08),'neck':(0,0,1.5),'top':(0,-0.05,1.72),
   'shL':(0.17,0,1.42),'elL':(0.4,0,1.25),'wrL':(0.63,-0.02,1.08),'fiL':(0.7,-0.04,0.99)},
   allow=[('Sombrero',['neck']),('Capa',['torso','hips','neck','upperArmR','upperArmL'])]),
 'ronin':dict(L={'hipL':(0.1,0,0.92),'kneeL':(0.1,-0.02,0.5),'ankleL':(0.1,0.02,0.08),'neck':(0,0,1.47),'top':(0,0,1.72),
   'shL':(0.19,0,1.37),'elL':(0.29,0,1.12),'wrL':(0.35,0,0.9),'fiL':(0.38,0,0.79)}),
 'musha':dict(L={'hipL':(0.1,0,0.92),'kneeL':(0.1,0,0.5),'ankleL':(0.1,0.02,0.1),'neck':(0,0,1.48),'top':(0,0,1.72),
   'shL':(0.2,0,1.37),'elL':(0.37,0,1.18),'wrL':(0.5,0,1.03),'fiL':(0.58,0,0.96)},
   map=[(r'^(_rootJoint|HIP|rope|hujia)','hips'),(r'^L_hujiaA','hips'),(r'^R_hujiaA','hips'),
        (r'^L_leg','thighL'),(r'^R_leg','thighR'),(r'^L_knee','shinL'),(r'^R_knee','shinR'),(r'^L_(ankle|foot)','footL'),(r'^R_(ankle|foot)','footR'),
        (r'^(spine|chest)','torso'),(r'^L_shoulder','torso'),(r'^R_shoulder','torso'),(r'^L_armojian','upperArmL'),(r'^R_armojian','upperArmR'),
        (r'^L_arm_','upperArmL'),(r'^R_arm_','upperArmR'),(r'^L_forarm','foreArmL'),(r'^R_forarm','foreArmR'),
        (r'^L_(hand|[mfrlt]\d?_)','handL'),(r'^R_(hand|[mfrlt]\d?_)','handR'),(r'^(neck|head)','neck')]),
 'archer':dict(L={'hipL':(0.11,0,0.9),'kneeL':(0.12,0,0.48),'ankleL':(0.12,0.02,0.12),'neck':(0,0,1.45),'top':(0,0,1.72),
   'shL':(0.17,0,1.37),'elL':(0.45,0,1.18),'wrL':(0.72,0,1.0),'fiL':(0.85,0,0.92)}),
 'boss':dict(L={'hipL':(0.1,0,0.92),'kneeL':(0.12,0,0.5),'ankleL':(0.14,0,0.1),'neck':(0,0,1.45),'top':(0,0,1.72),
   'shL':(0.22,0,1.35),'elL':(0.32,0,1.08),'wrL':(0.4,0,0.88),'fiL':(0.42,0,0.78)}),
}

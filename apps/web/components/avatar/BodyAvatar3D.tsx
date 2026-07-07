'use client';

/**
 * 3D 체형 아바타 렌더러 (AV-5)
 *
 * lib/avatar의 절차적 메시를 Three.js로 렌더. 드래그 회전 + 미조작 시 저속 자동 회전.
 * previous가 있으면 반투명 고스트를 겹쳐 "직전 대비" 실루엣 비교 (원리 §1.5).
 *
 * ⚠️ three(~150KB gzip) 직접 import — 반드시 BodyAvatarSection의 dynamic import로만 로드
 * (performance-guidelines: 초기 번들 보호). 직접 import 금지.
 *
 * @see docs/specs/SDD-BODY-AVATAR-3D.md §2.4
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { buildAvatarGeometry } from '@/lib/avatar';
import type { AvatarParams } from '@/lib/avatar';

interface BodyAvatar3DProps {
  params: AvatarParams;
  /** 직전 분석 파라미터 — 있으면 고스트 오버레이 */
  previous?: AvatarParams | null;
  /** WebGL 초기화 실패 시 호출 — 부모가 2D 폴백으로 전환 */
  onRenderFailed?: () => void;
}

/** 아바타 본체 색 — 중립 바이올렛 (라이트/다크 공용, 브랜드 톤) */
const AVATAR_COLOR = 0xa78bfa;
/** 고스트(직전 분석) 색 — 슬레이트 */
const GHOST_COLOR = 0x94a3b8;

function toBufferGeometry(params: AvatarParams): THREE.BufferGeometry {
  const { positions, indices } = buildAvatarGeometry(params);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  return geometry;
}

export default function BodyAvatar3D({ params, previous, onRenderFailed }: BodyAvatar3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // onRenderFailed는 렌더 루프 안에서 안 쓰이고 초기화 실패 시 1회만 — ref로 최신 유지
  const onFailedRef = useRef(onRenderFailed);
  onFailedRef.current = onRenderFailed;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      // WebGL 미지원/초기화 실패 → 부모가 2D 실루엣 폴백
      onFailedRef.current?.();
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
    camera.position.set(0, 1.05, 3.4);
    camera.lookAt(0, 0.92, 0);

    // 조명 — 부드러운 스튜디오 톤 (스타일라이즈드)
    scene.add(new THREE.HemisphereLight(0xffffff, 0x64748b, 1.6));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(2, 3, 4);
    scene.add(keyLight);

    // 아바타 그룹 (회전 대상)
    const group = new THREE.Group();
    scene.add(group);

    const disposables: { dispose(): void }[] = [];

    const bodyGeometry = toBufferGeometry(params);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: AVATAR_COLOR,
      roughness: 0.62,
      metalness: 0.05,
    });
    group.add(new THREE.Mesh(bodyGeometry, bodyMaterial));
    disposables.push(bodyGeometry, bodyMaterial);

    // 직전 분석 고스트 오버레이 — 동일 파라미터 공간이라 항상 정렬됨 (원리 §1.5)
    if (previous) {
      const ghostGeometry = toBufferGeometry(previous);
      const ghostMaterial = new THREE.MeshStandardMaterial({
        color: GHOST_COLOR,
        roughness: 0.8,
        metalness: 0,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      });
      group.add(new THREE.Mesh(ghostGeometry, ghostMaterial));
      disposables.push(ghostGeometry, ghostMaterial);
    }

    // 드래그 회전 + 미조작 시 저속 자동 회전 (OrbitControls 미사용 — 의존 최소화)
    let isDragging = false;
    let lastX = 0;
    let idleFrames = 0;

    const onPointerDown = (e: PointerEvent): void => {
      isDragging = true;
      lastX = e.clientX;
      container.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent): void => {
      if (!isDragging) return;
      group.rotation.y += (e.clientX - lastX) * 0.012;
      lastX = e.clientX;
      idleFrames = 0;
    };
    const onPointerUp = (): void => {
      isDragging = false;
    };
    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerUp);

    // 컨테이너 크기 추종
    const resize = (): void => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let frameId = 0;
    const animate = (): void => {
      frameId = requestAnimationFrame(animate);
      if (!isDragging) {
        idleFrames++;
        // 드래그 직후 잠시 정지했다가 자동 회전 재개
        if (idleFrames > 90) group.rotation.y += 0.004;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerUp);
      for (const d of disposables) d.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [params, previous]);

  return (
    <div
      ref={containerRef}
      data-testid="body-avatar-3d"
      className="w-full h-full touch-none cursor-grab active:cursor-grabbing"
      role="img"
      aria-label="내 체형 3D 아바타 — 드래그로 회전"
    />
  );
}

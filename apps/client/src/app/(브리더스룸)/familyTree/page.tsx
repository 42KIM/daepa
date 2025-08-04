"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  Background,
  ReactFlow,
  addEdge,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
  Position,
  NodeMouseHandler,
} from "@xyflow/react";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X } from "lucide-react";
import dagre from "@dagrejs/dagre";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

import "@xyflow/react/dist/style.css";
import { useQuery } from "@tanstack/react-query";
import { petControllerGetFamilyTree, PetDtoSex } from "@repo/api-client";

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const nodeWidth = 130;
const nodeHeight = 40;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = "TB") => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 30,
    edgesep: 20,
    ranksep: 60,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };

    return newNode;
  });

  return { nodes: newNodes, edges };
};

const FamilyTreePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { data: familyTreeData } = useQuery({
    queryKey: [petControllerGetFamilyTree.name],
    queryFn: petControllerGetFamilyTree,
  });

  // API 데이터를 React Flow 노드와 엣지로 변환
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!familyTreeData?.data) {
      return { nodes: [], edges: [] };
    }

    const data = familyTreeData.data;

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // 각 pairId별로 처리
    Object.entries(data).forEach(([pairId, pairData]) => {
      const { petList, father, mother } = pairData as any;

      // 부모 쌍 노드 생성
      if (father && mother && petList && petList.length > 0) {
        const parentNodeId = `pair-${pairId}`;
        nodes.push({
          id: parentNodeId,
          type: "default",
          position: { x: 0, y: 0 },
          data: {
            label: `${father.name} + ${mother.name}`,
            father,
            mother,
            children: petList,
            isParentPair: true,
          },
          style: {
            backgroundColor: "#10b981",
            color: "white",
            border: "2px solid",
            borderColor: "#059669",
          },
        });

        // 부모 쌍에서 자식들로의 연결
        petList.forEach((child: any) => {
          const childNodeId = `child-${child.petId}`;

          // 자식 노드 생성
          nodes.push({
            id: childNodeId,
            type: "default",
            position: { x: 0, y: 0 },
            data: {
              label: child.name || "이름 없음",
              pet: child,
              isChild: true,
            },
            style: {
              backgroundColor:
                child.sex === PetDtoSex.MALE
                  ? "#3b82f6"
                  : child.sex === PetDtoSex.FEMALE
                    ? "#ec4899"
                    : "#6b7280",
              color: "white",
              border: "2px solid",
              borderColor:
                child.sex === PetDtoSex.MALE
                  ? "#1d4ed8"
                  : child.sex === PetDtoSex.FEMALE
                    ? "#be185d"
                    : "#6b7280",
            },
          });

          // 부모 쌍에서 자식으로의 엣지 생성
          edges.push({
            id: `${parentNodeId}-${childNodeId}`,
            source: parentNodeId,
            target: childNodeId,
            type: "smoothstep",
          });
        });
      }
    });

    return { nodes, edges };
  }, [familyTreeData]);

  // 검색 필터링된 노드와 엣지
  const { filteredNodes, filteredEdges } = useMemo(() => {
    if (!searchQuery.trim()) {
      return { filteredNodes: initialNodes, filteredEdges: initialEdges };
    }

    const query = searchQuery.toLowerCase();
    const matchingNodeIds = new Set<string>();

    // 검색어와 일치하는 노드 찾기
    initialNodes.forEach((node) => {
      const nodeData = node.data as any;
      const label = nodeData.label?.toLowerCase() || "";
      const petName = nodeData.pet?.name?.toLowerCase() || "";
      const fatherName = nodeData.father?.name?.toLowerCase() || "";
      const motherName = nodeData.mother?.name?.toLowerCase() || "";

      if (
        label.includes(query) ||
        petName.includes(query) ||
        fatherName.includes(query) ||
        motherName.includes(query)
      ) {
        matchingNodeIds.add(node.id);

        // 부모 쌍 노드인 경우 연결된 자식들도 포함
        if (nodeData.isParentPair) {
          nodeData.children?.forEach((child: any) => {
            matchingNodeIds.add(`child-${child.petId}`);
          });
        }

        // 자식 노드인 경우 부모 쌍도 포함
        if (nodeData.isChild) {
          const parentPairId = node.id.replace("child-", "pair-").split("-")[0];
          matchingNodeIds.add(`pair-${parentPairId}`);
        }
      }
    });

    // 필터링된 노드들
    const filteredNodes = initialNodes.filter((node) => matchingNodeIds.has(node.id));

    // 필터링된 노드들 간의 엣지만 포함
    const filteredEdges = initialEdges.filter(
      (edge) => matchingNodeIds.has(edge.source) && matchingNodeIds.has(edge.target),
    );

    return { filteredNodes, filteredEdges };
  }, [initialNodes, initialEdges, searchQuery]);

  // 레이아웃 적용
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (filteredNodes.length === 0) {
      return { nodes: [], edges: [] };
    }
    return getLayoutedElements(filteredNodes, filteredEdges);
  }, [filteredNodes, filteredEdges]);

  // React Flow 상태 관리
  const [nodes, setNodes] = useNodesState(layoutedNodes);
  const [edges, setEdges] = useEdgesState(layoutedEdges);

  // layoutedNodes가 변경될 때 nodes 상태 업데이트
  React.useEffect(() => {
    if (layoutedNodes.length > 0) {
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) => addEdge({ ...params, type: ConnectionLineType.SmoothStep }, eds)),
    [],
  );

  // 노드 클릭 핸들러
  const onNodeClick: NodeMouseHandler = useCallback(
    (event, node) => {
      const nodeData = node.data as any;

      // 자식 노드인 경우 펫 상세 페이지로 이동
      if (nodeData.isChild && nodeData.pet?.petId) {
        router.push(`/pet/${nodeData.pet.petId}`);
      }

      // 부모 쌍 노드인 경우 첫 번째 자식의 상세 페이지로 이동 (또는 선택 가능한 옵션 제공)
      if (nodeData.isParentPair && nodeData.children?.length > 0) {
        const firstChild = nodeData.children[0];
        router.push(`/pet/${firstChild.petId}`);
      }
    },
    [router],
  );

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* 헤더 섹션 */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">가족관계도</h1>
            <p className="text-muted-foreground">펫들의 혈통 관계를 시각적으로 확인하세요</p>
          </div>
        </div>

        {/* 검색 기능 */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="펫 이름으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 가족 관계도 */}
      <Card>
        <CardContent className="p-0">
          <div className="h-[600px] w-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              connectionLineType={ConnectionLineType.SmoothStep}
              fitView
              fitViewOptions={{ padding: 0.1 }}
              className="bg-gray-50"
            >
              <Background />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyTreePage;

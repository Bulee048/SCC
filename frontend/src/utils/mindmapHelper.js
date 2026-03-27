// src/utils/mindmapHelper.js

export const convertToReactFlowNodesAndEdges = (aiData) => {
    const nodes = [];
    const edges = [];
    
    // Read data by using Recursive function
    const traverse = (nodeData, parentId = null) => {
        // Create a new node for React Flow based on the current node data
        const newNode = {
            id: nodeData.id,
            //decide  Main node, Subject node, Or normal node
            type: nodeData.type === 'main' ? 'input' : (nodeData.children ? 'default' : 'output'),
            data: { label: nodeData.data.label },
            position: nodeData.position || { x: Math.random() * 200, y: Math.random() * 200 }, //gen. auto position if not provided
            style: getStyle(nodeData.type) // color change acco. to the node type
        };

        nodes.push(newNode);

        // if have parent node, create an edge from parent to current node
        if (parentId) {
            edges.push({
                id: `e-${parentId}-${nodeData.id}`,
                source: parentId,
                target: nodeData.id,
                animated: true, // edge animation for better visualization
                style: { stroke: '#4F46E5', strokeWidth: 2 }
            });
        }

        // if have children, recursively traverse them
        if (nodeData.children && nodeData.children.length > 0) {
            nodeData.children.forEach(child => traverse(child, nodeData.id));
        }
    };

    // Start traversal from the root node (assuming aiData is the root)
    if(aiData.id) {
       traverse(aiData);
    }
    
    return { nodes, edges };
};

//  Define styles for different node types (main, subject, topic, subtopic)
const getStyle = (type) => {
    if (type === 'main') return { background: '#2563EB', color: '#fff', border: 'none', fontWeight: 'bold' };
    if (type === 'subject') return { background: '#10B981', color: '#fff', border: 'none' };
    if (type === 'topic') return { background: '#F59E0B', color: '#fff', border: 'none' };
    return { background: '#F3F4F6', color: '#1F2937', border: '1px solid #D1D5DB' }; // Subtopic
};
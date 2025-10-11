import React from 'react';
import { MapPin, Users, Mail, Phone, Globe, Edit2, Share2, Plus, Briefcase, GraduationCap, Award, Star, Eye, MessageCircle, Github } from 'lucide-react';

export default function ProfileCard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left & Center */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Section */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-teal-700 to-teal-500 h-32"></div>
              <div className="px-6 pb-6 relative">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop"
                      alt="Amara Okafor"
                      className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                    />
                    <div className="mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">Amara Okafor</h1>
                      <p className="text-gray-600 mt-1">Senior Software Engineer & Tech Entrepreneur</p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <MapPin size={14} />
                        <span>Lagos, Nigeria</span>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Users size={14} className="text-teal-600" />
                          <strong>2,847</strong> connections
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <Eye size={14} className="text-teal-600" />
                          <strong>1,234</strong> profile views
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <Star size={14} className="text-yellow-500 fill-yellow-500" />
                          <strong>4.9</strong> rating
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition font-medium">
                      <Users size={16} />
                      Connect
                    </button>
                    <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg flex items-center gap-2 transition font-medium">
                      <MessageCircle size={16} />
                      Message
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
              <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
                <p>
                  Passionate software engineer with 8+ years of experience building scalable web applications and leading cross-functional teams. Currently focused on fintech solutions that bridge traditional banking with digital innovation across Africa.
                </p>
                <p>
                  I'm particularly interested in connecting with entrepreneurs, investors, and tech professionals who share a vision for Africa's digital transformation. Always open to discussing new opportunities and collaborations.
                </p>
              </div>
            </div>

            {/* Skills & Expertise */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Skills & Expertise</h2>
              <div className="flex flex-wrap gap-2">
                <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm">JavaScript</span>
                <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm">React</span>
                <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm">Node.js</span>
                <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm">Python</span>
                <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm">AWS</span>
                <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm">Team Leadership</span>
                <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm">Fintech</span>
                <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm">Blockchain</span>
              </div>
            </div>

            {/* Experience */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Experience</h2>
                <button className="text-teal-600 hover:text-teal-700 flex items-center gap-1 text-sm font-medium">
                  <Plus size={16} />
                  Add
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg h-fit">
                    <Briefcase className="text-blue-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Senior Software Engineer</h3>
                    <p className="text-teal-600 font-medium text-sm">TechNova Solutions</p>
                    <p className="text-gray-500 text-sm mt-1">Jan 2021 - Present • Lagos, Nigeria</p>
                    <p className="text-gray-600 text-sm mt-3 leading-relaxed">
                      Leading development of mobile banking platform serving 500K+ users across West Africa. Managed team of 8 engineers and reduced transaction processing time by 40%.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-green-100 p-3 rounded-lg h-fit">
                    <Briefcase className="text-green-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Co-Founder & CTO</h3>
                    <p className="text-teal-600 font-medium text-sm">PayFlow Africa</p>
                    <p className="text-gray-500 text-sm mt-1">Mar 2019 - Dec 2020 • Lagos, Nigeria</p>
                    <p className="text-gray-600 text-sm mt-3 leading-relaxed">
                      Co-founded fintech startup focused on cross-border payments. Built MVP and secured $2M seed funding. Successfully exited to TechNova Solutions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Education */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Education</h2>
                <button className="text-teal-600 hover:text-teal-700 flex items-center gap-1 text-sm font-medium">
                  <Plus size={16} />
                  Add
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg h-fit">
                    <GraduationCap className="text-purple-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Master of Science in Computer Science</h3>
                    <p className="text-teal-600 text-sm">University of Lagos</p>
                    <p className="text-gray-500 text-sm mt-1">2015 - 2017</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-orange-100 p-3 rounded-lg h-fit">
                    <Award className="text-orange-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">AWS Solutions Architect Certification</h3>
                    <p className="text-teal-600 text-sm">Amazon Web Services</p>
                    <p className="text-gray-500 text-sm mt-1">2020</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <Mail size={16} className="text-gray-400" />
                  <span>amara.okafor@email.com</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <Phone size={16} className="text-gray-400" />
                  <span>+234 801 234 5678</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <Briefcase size={16} className="text-gray-400" />
                  <span>linkedin.com/in/amaraokafor</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <Github size={16} className="text-gray-400" />
                  <span>github.com/amaraokafor</span>
                </div>
              </div>
            </div>

            {/* Languages */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Languages</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 text-sm">English</span>
                  <span className="text-gray-500 text-xs">Native</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 text-sm">Yoruba</span>
                  <span className="text-gray-500 text-xs">Native</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 text-sm">French</span>
                  <span className="text-gray-500 text-xs">Conversational</span>
                </div>
              </div>
            </div>

            {/* Interests */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Interests</h2>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs">Fintech</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs">AI/ML</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs">Entrepreneurship</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs">Mentoring</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs">Travel</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs">Photography</span>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">
                    Posted about <span className="text-teal-600 font-medium">fintech innovation</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    Connected with <span className="text-teal-600 font-medium">James Chen</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">1 day ago</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    Shared an article about <span className="text-teal-600 font-medium">blockchain adoption</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">3 days ago</p>
                </div>
              </div>
            </div>

            {/* Mutual Connections */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Mutual Connections</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop"
                    alt="David Osei"
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">David Osei</p>
                    <p className="text-xs text-gray-500">Product Manager</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop"
                    alt="Sarah Johnson"
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Sarah Johnson</p>
                    <p className="text-xs text-gray-500">UX Designer</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop"
                    alt="Michael Adebayo"
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Michael Adebayo</p>
                    <p className="text-xs text-gray-500">Data Scientist</p>
                  </div>
                </div>
                <button className="text-teal-600 hover:text-teal-700 text-sm font-medium w-full text-center mt-2">
                  View all connections
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}